/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import mockStore from '../__mocks__/store'
import { localStorageMock } from '../__mocks__/localStorage'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import NewBillUI from '../views/NewBillUI'
import NewBill from '../containers/NewBill'
import router from '../app/Router.js'
import BillsUI from '../views/BillsUI.js'
import '@testing-library/jest-dom'

// appel des données mockées
jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    // pré environnement
    // beforeEach = je charge l'environnement pour l'ensemble de mon describe - evite les doublons
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH['NewBill'] },
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
    })

    // icone bien surligné
    test('Then mail icon in vertical layout should be highlighted', () => {
      const icon = screen.getByTestId('icon-mail')
      expect(icon.className).toBe('active-icon')
    })

    // je peux éditer une nouvelle note de frais
    test('Then there are a form to edit new bill', () => {
      const html = NewBillUI({})
      document.body.innerHTML = html
      const contentTitle = screen.getAllByText('Envoyer une note de frais')
      expect(contentTitle).toBeTruthy()
    })
  })

  describe('When I want to click on button change file', () => {
    // beforeEach = je charge l'environnement pour l'ensemble de mon describe - evite les doublons
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH['NewBill'] },
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
    })
    // nettoyage
    afterAll(() => {
      console.error.mockRestore()
    })

    test('Then I can choose a file with a good extension (jpeg - jpg - png) ', async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')

      const img = new File(['img'], 'image.png', { type: 'image/png' })

      inputFile.addEventListener('change', handleChangeFile)
      await waitFor(() => {
        userEvent.upload(inputFile, img)
      })
      // je vérifie que l'image est au bon format - la fct handlechangefile est bien appelée - le fichier appelé est valide (format)
      expect(inputFile.files[0].name).toBe('image.png')
      expect(handleChangeFile).toBeCalled()
      expect(newBill.validFile).toBeTruthy()
    })

    test("Then the button 'Envoyer' is enable ", () => {
      // doublon
      // Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      // window.localStorage.setItem(
      //   'user',
      //   JSON.stringify({
      //     type: 'Employee',
      //   })
      // )
      // const root = document.createElement('div')
      // root.setAttribute('id', 'root')
      // document.body.append(root)
      // router()
      // window.onNavigate(ROUTES_PATH.NewBill)
      // document.body.innerHTML = NewBillUI()

      const newBillObject2 = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const file = screen.getByTestId('file')
      const handleChangeFile = jest.fn((e) =>
        newBillObject2.handleChangeFile(e)
      )

      file.addEventListener('change', handleChangeFile)
      fireEvent.change(file, {
        target: {
          files: [new File(['image'], 'image.png')],
        },
      })
      // le bouton est enable - bon format d'extension
      expect(handleChangeFile).toHaveBeenCalled()
      const button = document.getElementById('btn-send-bill')
      expect(button).toBeEnabled()
    })

    test('Then I can choose a file with a bad extension', async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')

      // test avec un document word .docx
      const docx = new File(['doc'], 'document.docx', {
        type: 'text/plaincharset=utf-8',
      })

      inputFile.addEventListener('change', handleChangeFile)
      await waitFor(() => {
        userEvent.upload(inputFile, docx)
      })

      expect(inputFile.files[0].name).toBe('document.docx')
      expect(handleChangeFile).toBeCalled()
      expect(newBill.validFile).not.toBeTruthy()
    })
    test("Then the button 'Envoyer' is disable ", () => {
      // doublon
      // // pré environnement
      // Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      // window.localStorage.setItem(
      //   'user',
      //   JSON.stringify({
      //     type: 'Employee',
      //   })
      // )
      // const root = document.createElement('div')
      // root.setAttribute('id', 'root')
      // document.body.append(root)
      // router()
      // window.onNavigate(ROUTES_PATH.NewBill)
      // document.body.innerHTML = NewBillUI()

      const newBillObject = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const file = screen.getByTestId('file')
      const handleChangeFile = jest.fn((e) => newBillObject.handleChangeFile(e))

      file.addEventListener('change', handleChangeFile)
      fireEvent.change(file, {
        target: {
          files: [new File(['Document'], 'document.docx')],
        },
      })
      // bouton disable si mauvaise extension
      expect(handleChangeFile).toHaveBeenCalled()
      const button = document.getElementById('btn-send-bill')
      expect(button).toBeDisabled()
    })
  })

  // bon format - je peux envoyer ma note de frais
  describe('When the form is correct and I click on submit button', () => {
    test('Then I should post new Bill ticket', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH['NewBill'] },
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
      // we have to mock navigation to test it
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      //simu charge la pj
      const chargeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const file = screen.getByTestId('file')
      const test = new File(["c'est un test"], 'test.jpg', {
        //condition du test
        type: 'image/jpg',
      })
      file.addEventListener('change', chargeFile)
      fireEvent.change(file, { target: { files: [test] } })
      expect(chargeFile).toHaveBeenCalled()
      expect(file.files[0]).toStrictEqual(test)

      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeTruthy()

      const envoiNewBill = jest.fn((e) => newBill.handleSubmit(e))
      formNewBill.addEventListener('submit', envoiNewBill)
      fireEvent.submit(formNewBill)
      expect(envoiNewBill).toHaveBeenCalled()
    })

    test('Then it should be render Bills Page', () => {
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })
})
// creation data
// Test d'intégration POST
describe('Given I am connected as an employee', () => {
  describe('When I add a new bill', () => {
    test('fetches bills from mock API POST', async () => {
      const spy = jest.spyOn(mockStore.bills(), 'update')
      // environnement
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      )
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
      const form = screen.getByTestId('form-new-bill')
      // simu mock
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('click', handleSubmit)
      fireEvent.click(form)
      expect(handleSubmit).toHaveBeenCalled()
      expect(spy).toHaveBeenCalled()
      const billsPage = screen.getByTestId('tbody')
      expect(billsPage).toBeInTheDocument()
    })
  })
  test('Then it fails with a 404 message error', async () => {
    const html = BillsUI({ error: 'Erreur 404' })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
  test('Then it fails with a 500 message error', async () => {
    const html = BillsUI({ error: 'Erreur 500' })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})
