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

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    // pré environnement
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
      expect(contentTitle).toBeTruthy
    })
  })

  describe('When I want to click on button change file', () => {
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
      // pré environnement
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

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
      // pré environnement
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      document.body.innerHTML = NewBillUI()

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
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      // Define inputs values
      const inputData = {
        type: 'Transports',
        name: 'TGV Marseille-Paris',
        amount: '53',
        date: '2020-04-13',
        vat: 10,
        pct: 20,
        file: new File(['img'], 'billet.png', { type: 'image/png' }),
        commentary: 'billet de train sncf',
        status: 'pending',
      }

      // éléments de la page récupérés
      const inputType = screen.getByTestId('expense-type')
      const inputName = screen.getByTestId('expense-name')
      const inputDate = screen.getByTestId('datepicker')
      const inputAmmount = screen.getByTestId('amount')
      const inputVat = screen.getByTestId('vat')
      const inputPct = screen.getByTestId('pct')
      const inputComment = screen.getByTestId('commentary')
      const inputFile = screen.getByTestId('file')
      const form = screen.getByTestId('form-new-bill')

      // simulation valeurs
      fireEvent.change(inputType, { target: { value: inputData.type } })
      fireEvent.change(inputName, { target: { value: inputData.name } })
      fireEvent.change(inputDate, { target: { value: inputData.date } })
      fireEvent.change(inputAmmount, { target: { value: inputData.amount } })
      fireEvent.change(inputVat, { target: { value: inputData.vat } })
      fireEvent.change(inputPct, { target: { value: inputData.pct } })
      fireEvent.change(inputComment, {
        target: { value: inputData.commentary },
      })
      userEvent.upload(inputFile, inputData.file)

      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalled()

      // // Submit form
      // const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      // form.addEventListener('submit', handleSubmit)

      // await waitFor(() => {
      //   userEvent.upload(inputFile, inputData.file)
      // })
      // fireEvent.submit(form)
      // expect(handleSubmit).toHaveBeenCalled()

      // Verification validité
      expect(inputType.validity.valid).toBeTruthy()
      expect(inputName.validity.valid).toBeTruthy()
      expect(inputDate.validity.valid).toBeTruthy()
      expect(inputAmmount.validity.valid).toBeTruthy()
      expect(inputVat.validity.valid).toBeTruthy()
      expect(inputPct.validity.valid).toBeTruthy()
      expect(inputComment.validity.valid).toBeTruthy()
      expect(inputFile.files[0]).toBeDefined()
    })

    test('Then it should be render Bills Page', () => {
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })

  describe('When the form is incorrect format and I click on submit button', () => {
    test('Then I should have an error HTML validator form', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH['NewBill'] },
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      // test erreur dans la date
      const inputData = {
        type: 'Transports',
        name: 'TGV Marseille-Paris',
        amount: '53',
        date: 'test incorrect date',
        vat: 10,
        pct: 20,
        file: new File(['img'], 'billet.png', { type: 'image/png' }),
        commentary: 'billet de train sncf',
        status: 'pending',
      }

      const inputType = screen.getByTestId('expense-type')
      const inputName = screen.getByTestId('expense-name')
      const inputDate = screen.getByTestId('datepicker')
      const inputAmmount = screen.getByTestId('amount')
      const inputVat = screen.getByTestId('vat')
      const inputPct = screen.getByTestId('pct')
      const inputComment = screen.getByTestId('commentary')
      const inputFile = screen.getByTestId('file')
      const form = screen.getByTestId('form-new-bill')

      fireEvent.change(inputType, { target: { value: inputData.type } })
      fireEvent.change(inputName, { target: { value: inputData.name } })
      fireEvent.change(inputDate, { target: { value: inputData.date } })
      fireEvent.change(inputAmmount, { target: { value: inputData.amount } })
      fireEvent.change(inputVat, { target: { value: inputData.vat } })
      fireEvent.change(inputPct, { target: { value: inputData.pct } })
      fireEvent.change(inputComment, {
        target: { value: inputData.commentary },
      })
      await waitFor(() => {
        userEvent.upload(inputFile, inputData.file)
      })

      // // Simulation formulaire soumis
      // const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      // form.addEventListener('submit', handleSubmit)
      // fireEvent.submit(form)

      // expect(handleSubmit).toHaveBeenCalled()
      // // verif erreur date
      // expect(inputDate.validity.valid).not.toBeTruthy()

      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalled()
      expect(inputDate.validity.valid).not.toBeTruthy()
    })
  })
})

// test d'intégration - POST -
// création data
describe('Given I am connected as an employee', () => {
  describe('When I add a new bill', () => {
    test('Then a new bill is created', () => {
      document.body.innerHTML = NewBillUI()
      const inputData = {
        type: 'Transports',
        name: 'Test',
        datepicker: '2022-06-02',
        amount: '53',
        vat: '10',
        pct: '20',
        commentary: 'Test',
        file: new File(['test'], 'test.png', { type: 'image/png' }),
      }

      const formNewBill = screen.getByTestId('form-new-bill')
      const inputName = screen.getByTestId('expense-name')
      const inputType = screen.getByTestId('expense-type')
      const inputDate = screen.getByTestId('datepicker')
      const inputAmount = screen.getByTestId('amount')
      const inputVat = screen.getByTestId('vat')
      const inputPct = screen.getByTestId('pct')
      const inputComment = screen.getByTestId('commentary')
      const inputFile = screen.getByTestId('file')

      fireEvent.change(inputType, {
        target: { value: inputData.type },
      })
      expect(inputType.value).toBe(inputData.type)

      fireEvent.change(inputName, {
        target: { value: inputData.name },
      })
      expect(inputName.value).toBe(inputData.name)

      fireEvent.change(inputDate, {
        target: { value: inputData.datepicker },
      })
      expect(inputDate.value).toBe(inputData.datepicker)

      fireEvent.change(inputAmount, {
        target: { value: inputData.amount },
      })
      expect(inputAmount.value).toBe(inputData.amount)

      fireEvent.change(inputVat, {
        target: { value: inputData.vat },
      })
      expect(inputVat.value).toBe(inputData.vat)

      fireEvent.change(inputPct, {
        target: { value: inputData.pct },
      })
      expect(inputPct.value).toBe(inputData.pct)

      fireEvent.change(inputComment, {
        target: { value: inputData.commentary },
      })
      expect(inputComment.value).toBe(inputData.commentary)

      userEvent.upload(inputFile, inputData.file)
      expect(inputFile.files[0]).toStrictEqual(inputData.file)
      expect(inputFile.files).toHaveLength(1)

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() =>
            JSON.stringify({
              email: 'email@test.com',
            })
          ),
        },
        writable: true,
      })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn(newBill.handleSubmit)
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill)
      expect(handleSubmit).toHaveBeenCalled()
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
})
