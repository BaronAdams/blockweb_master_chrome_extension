import logo from '@/assets/blockweb_master_icon.svg'
import HelloWorld from '@/components/HelloWorld'
import './App.css'

export default function App() {
  return (
    <div>
      <a href="#" target="_blank" rel="noreferrer">
        <img src={logo} className="logo" alt="Vite logo" />
      </a>
      {/* <a href="https://reactjs.org/" target="_blank" rel="noreferrer">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>
      <a href="https://crxjs.dev/vite-plugin" target="_blank" rel="noreferrer">
        <img src={crxLogo} className="logo crx" alt="crx logo" />
      </a> */}
      <HelloWorld msg="Vite + React + CRXJS" />
    </div>
  )
}
