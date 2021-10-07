import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import NewBillUI from "../views/NewBillUI.js"
import userEvent from "@testing-library/user-event"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES } from "../constants/routes.js"
import firebase from "../__mocks__/firebase.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^([1-9]|[12][0-9]|3[01]) ([a-zé]{3,4}[.]) (\d{4})$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe('after successful login', () => {
    it('successful loading page', () => {
      const html = BillsUI({loading: true}) 
      document.body.innerHTML = html
      expect(screen.getByText(/Loading.../)).toBeTruthy()
    })
    it('error on loading page', () => {
      const html = BillsUI({error: 'error message'})
      document.body.innerHTML = html
      expect(screen.getByText('error message')).toBeTruthy()
    })
  })
  describe('when I click on icon eye', () => {
    it('modal bill should open', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      
      const newBills = new Bills ({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })

      jQuery.fn.extend({
        modal: function() {
        },
      });

      const iconEye = screen.queryAllByTestId("icon-eye")
      const handleClickIconEye = jest.fn(e => newBills.handleClickIconEye)
      iconEye[0].addEventListener('click', handleClickIconEye)
      userEvent.click(iconEye[0])
      expect(handleClickIconEye).toHaveBeenCalled()

      const modale = document.getElementById('modaleFile')
      expect(modale).toBeTruthy()
    })
  })
  describe("Given I am a user connected as Employee", () => {
    describe("When user click on new bill button", () => {
      test("Then new bill page should open", () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
        }))
        const html = BillsUI({ data: [] })
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBills = new Bills ({
          document, onNavigate, firestore: null, localStorage: window.localStorage
        })
        const buttonNewBill = screen.getByTestId("btn-new-bill")
        const handleClickNewBill = jest.fn((e) => newBills.handleClickNewBill(e))
        buttonNewBill.addEventListener('click', handleClickNewBill)
        userEvent.click(buttonNewBill)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(NewBillUI()).toBeTruthy()
        })
      })
    })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to bills board", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(firebase, "get")
       const bills = await firebase.get()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})