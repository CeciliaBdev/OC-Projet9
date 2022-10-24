/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { screen, waitFor, getByTestId } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import mockStore from '../__mocks__/store'
import { bills } from '../fixtures/bills.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import router from '../app/Router.js'
import BillsUI from '../views/BillsUI.js'
import BillsContainer from '../containers/Bills'

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
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
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      // on souhaite que l'icone est bien la classe active
      expect(windowIcon.className).toBe('active-icon')
    })
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({
        data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)),
      })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  // quand je clique sur l'oeil pour voir la piece jointe
  describe('When I am on Bills Page and i click on icon Eye of bill', () => {
    test('Then modal with the document appears', () => {
      $.fn.modal = jest.fn() // Prevent jQuery error
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      const html = BillsUI({
        data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)),
      })
      document.body.innerHTML = html

      const billsContainer = new BillsContainer({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleShowModalFile = jest.fn((e) => {
        billsContainer.handleClickIconEye(e.target)
      })

      iconEye.addEventListener('click', handleShowModalFile)
      userEvent.click(iconEye)

      // verif texte Justificatif
      expect(handleShowModalFile).toHaveBeenCalled()
      expect(screen.getAllByText('Justificatif')).toBeTruthy()
    })
  })

  // quand je clique sur "nouvelle note de frais", un formulaire pour une nouvelle note apparait
  describe('When I click on "Nouvelle note de frais', () => {
    test('Then a form for a new bill appears', () => {
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
      // identification du bouton "nouvelle notre de frais" par id
      const newBillButton = getByTestId(document.body, 'btn-new-bill')
      // creation du mock navigate - simulation
      const navigate = jest.fn(window.onNavigate(ROUTES_PATH.NewBill))
      newBillButton.addEventListener('click', navigate)
      userEvent.click(newBillButton)
      //verif texte Envoyer une note de frais présent
      const titleForm = screen.getByTestId('title-form')
      expect(titleForm).toHaveTextContent('Envoyer une note de frais')
    })
  })
})

// test d'intégration GET
test('fetches bills from mock API GET', async () => {
  //Connection en tant qu'employé
  localStorage.setItem(
    'user',
    JSON.stringify({ type: 'Employee', email: 'a@a' })
  )
  const root = document.createElement('div')
  root.setAttribute('id', 'root')
  document.body.append(root)
  router()

  window.onNavigate(ROUTES_PATH.Bills)

  await waitFor(() => screen.getByText('Mes notes de frais'))
  const contentNewBill = await screen.getByTestId('btn-new-bill')
  expect(contentNewBill).toBeTruthy()
})

describe('When an error occurs on API', () => {
  beforeEach(() => {
    // fct simulée (mock)
    jest.spyOn(mockStore, 'bills')
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'a@a',
      })
    )
    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.appendChild(root)
    router()
  })
  test('fetches bills from an API and fails with 404 message error', async () => {
    // simulation d'une erreur - ressource non dispo (faute de frappe url ou ressources non accessibles (mauvais chemin))
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error('Erreur 404'))
        },
      }
    })
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick)
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })

  test('fetches messages from an API and fails with 500 message error', async () => {
    // simulation d'une erreur (erreur coté serveur - back end)
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error('Erreur 500'))
        },
      }
    })
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick)
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})
