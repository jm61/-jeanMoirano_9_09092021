import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES } from "../constants/routes.js"
import userEvent from "@testing-library/user-event"
import firebase from "../__mocks__/firebase.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I choose a non required file", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const html = NewBillUI()
      document.body.innerHTML = html
      window.alert = jest.fn()

      const newBill = new NewBill({ 
        document, 
        onNavigate, 
        firestore: null, 
        localStorage: window.localStorage
      })
      
      const file = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      file.addEventListener('change', handleChangeFile)
      fireEvent.change(file, { 
        target: {
          files: [new File([''], 'chucknorris.gif', {
            type: 'image/gif'
          })],
        }
      })
      expect(handleChangeFile).toHaveBeenCalled()
    })

    test("Then I choose a require file", () => {
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({ 
        document, 
        onNavigate, 
        firestore: null, 
        localStorage: window.localStorage
      })
      
      const inputIdFile = screen.getByTestId('file')
      const file = [new File([''], 'chucknorris.jpg', {type: 'image/jpg'})]
      Object.defineProperty(inputIdFile, 'value', {
        value: "C:\\fakepath\\chucknorris.jpg"
      })
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      inputIdFile.addEventListener('change', handleChangeFile)
      fireEvent.change(inputIdFile, { 
        target: {
          files: file,
        }
      })
      expect(handleChangeFile).toHaveBeenCalled()
    })

    test("Then I submit valid bill", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'toto@test'
      }))

      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const expenseType = screen.getByTestId('expense-type')
      userEvent.selectOptions(expenseType, [ screen.getByText('Transports') ])

      const date = screen.getByTestId('datepicker')
      userEvent.type(date, '2021-07-19')

      const amount = screen.getByTestId('amount')
      userEvent.type(amount, '23')

      const pct = screen.getByTestId('pct')
      userEvent.type(pct, '20')

      const justificatif = screen.getByTestId('file')
      const file = new File(['hello'], 'hello.png', { type: 'image/png' })
      userEvent.upload(justificatif, file)
      expect(justificatif.files).toHaveLength(1)

      const bill = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => bill.handleSubmit(e))

      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form) 
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })
  })
})

describe("Given I am a user connected as Employee", () => {
  describe("When I fill new bill form", () => {
    test("Fetches bill ID from mock API post", async() => {
      const dataBill = {
        email:  'a@a',
        type: 'Hôtel et logement',
        name:  'encore',
        amount: 400,
        date:  '2004-04-04',
        vat: '80',
        pct: 20,
        commentary: 'séminaire billed',
        fileUrl: '',
        fileName: 'preview-facture-free-201801-pdf-1.jpg',
      }
      const postSpy = jest.spyOn(firebase, 'post')
      const postBill = await firebase.post(dataBill)

      //mock de la fonction POST exécuté 1 fois
      expect(postSpy).toHaveBeenCalledTimes(1)
      //mock de la fonction POST retourné avec succé
      expect(postSpy).toReturn()
      //l'ID est présent dans le POST
      expect(postBill).toHaveProperty("id")
      expect(postBill.id).toBeTruthy()
      expect(postBill.id).toMatch("47qAXb6fIm2zOKkLzMro")
      //la bills posté est présente dans la table de bills 
      const getSpy = jest.spyOn(firebase, "get")
      const bills = await firebase.get()
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(bills.data[0].id).toBe(postBill.id)
    })
  })
  describe("When new bill is submit", () => {
    test("Then bills table is displayed ", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = NewBillUI()

      const bill = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => bill.handleSubmit(e))

      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form) 

      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })
})
