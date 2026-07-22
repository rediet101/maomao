import { useState } from 'react'
import './App.css'
import About from './components/About'
import Contact from './components/Contact'
import Hero from './components/Hero'
import Login from './components/Login'
import Menu from './components/Menu'
import Navbar from './components/Navbar'
import Orders from './components/Orders'
import Testimonials from './components/Testimonials'

export type Page = 'home' | 'login' | 'orders'

// What to do after login
export type LoginIntent = 'orders' | 'reserve'

export interface CustomerUser {
  name: string;
  phone: string;
}

const STORAGE_KEY = 'maomao_customer'

const loadCustomer = (): CustomerUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CustomerUser) : null
  } catch {
    return null
  }
}

const saveCustomer = (c: CustomerUser) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
}

const clearCustomer = () => {
  localStorage.removeItem(STORAGE_KEY)
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [customer, setCustomer] = useState<CustomerUser | null>(loadCustomer)
  const [loginIntent, setLoginIntent] = useState<LoginIntent>('orders')
  const [pendingItemId, setPendingItemId] = useState<number | null>(null)

  const logout = () => {
    clearCustomer()
    setCustomer(null)
    setPage('home')
  }

  /* Navbar Orders button clicked */
  const handleOrdersNav = () => {
    if (customer) {
      setPage('orders')
    } else {
      setLoginIntent('orders')
      setPage('login')
    }
  }

  /* Menu Reserve button clicked without being logged in */
  const handleReserve = (itemId: number) => {
    if (customer) return // Menu opens modal directly
    setPendingItemId(itemId)
    setLoginIntent('reserve')
    setPage('login')
  }

  /* After login */
  const handleLogin = (name: string, phone: string) => {
    const user = { name, phone }
    saveCustomer(user)
    setCustomer(user)
    if (loginIntent === 'orders') {
      setPage('orders')
    } else {
      setPage('home') // pendingItemId stays set — Menu picks it up
    }
  }

  const handlePendingConsumed = () => setPendingItemId(null)

  if (page === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => { setPage('home'); setPendingItemId(null) }}
      />
    )
  }

  if (page === 'orders') {
    return <Orders onBack={() => setPage('home')} customer={customer} />
  }

  return (
    <>
      <Navbar
        customer={customer}
        onOrdersClick={handleOrdersNav}
        onLogout={logout}
      />
      <Hero />
      <About />
      <Menu
        customer={customer}
        onRequireLogin={handleReserve}
        pendingItemId={pendingItemId}
        onPendingConsumed={handlePendingConsumed}
      />
      <Testimonials />
      <Contact />
    </>
  )
}

export default App
