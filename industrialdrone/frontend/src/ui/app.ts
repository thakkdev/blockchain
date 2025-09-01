import { ethers } from 'ethers'

async function loadJSON(path: string) {
  const res = await fetch(path)
  return res.json()
}

export async function initApp() {
  const root = document.getElementById('root')!
  root.innerHTML = `
    <div style="font-family:sans-serif;padding:16px;max-width:720px">
      <h1>Industrial Drone DApp (vanilla)</h1>

      <section>
        <h2>Register Drone</h2>
        <input id="metadata" value="Drone: demo" style="width:60%" />
        <button id="btn-register">Register</button>
      </section>

      <section>
        <h2>Post Task (operator)</h2>
        <input id="taskDesc" value="Inspect A-12" style="width:60%" />
        <input id="deadline" type="number" style="width:35%;margin-left:8px" />
        <button id="btn-post">Post</button>
      </section>

      <section>
        <h2>Bid / Assign</h2>
        <label>Task ID: </label><input id="taskId" type="number" value="0" style="width:100px" />
        <div>
          <button id="btn-bid">Bid as current account</button>
          <button id="btn-assign">Assign (operator)</button>
          <button id="btn-refresh">Refresh Assigned</button>
        </div>
        <div id="assigned">Assigned Drone: (none yet)</div>
      </section>
    </div>
  `

  // load artifacts
  const [registryInfo, managerInfo] = await Promise.all([
    loadJSON('/src/contracts/DroneRegistry.json'),
    loadJSON('/src/contracts/TaskManager.json'),
  ])

  const anyWindow = window as any
  if (!anyWindow.ethereum) {
    alert('Please install MetaMask or another web3 provider and connect to Hardhat')
    return
  }

  const provider = new ethers.BrowserProvider(anyWindow.ethereum)
  await anyWindow.ethereum.request({ method: 'eth_requestAccounts' })
  const signer = await provider.getSigner()

  const registry = new ethers.Contract(registryInfo.address, registryInfo.abi, signer)
  const manager = new ethers.Contract(managerInfo.address, managerInfo.abi, signer)

  // wire buttons
  document.getElementById('btn-register')!.addEventListener('click', async () => {
    const metadata = (document.getElementById('metadata') as HTMLInputElement).value
    const addr = await signer.getAddress()
    const tx = await registry.registerDrone(addr, metadata)
    await tx.wait()
    alert('Registered: '+addr)
  })

  document.getElementById('btn-post')!.addEventListener('click', async () => {
    const desc = (document.getElementById('taskDesc') as HTMLInputElement).value
    const dl = parseInt((document.getElementById('deadline') as HTMLInputElement).value) || (Math.floor(Date.now()/1000)+3600)
    const tx = await manager.postTask(desc, dl)
    await tx.wait()
    alert('Posted')
  })

  document.getElementById('btn-bid')!.addEventListener('click', async () => {
    const id = parseInt((document.getElementById('taskId') as HTMLInputElement).value) || 0
    const tx = await manager.bidForTask(id)
    await tx.wait()
    alert('Bid placed')
  })

  document.getElementById('btn-assign')!.addEventListener('click', async () => {
    const id = parseInt((document.getElementById('taskId') as HTMLInputElement).value) || 0
    const tx = await manager.assignTask(id)
    await tx.wait()
    alert('Assigned')
  })

  document.getElementById('btn-refresh')!.addEventListener('click', async () => {
    const id = parseInt((document.getElementById('taskId') as HTMLInputElement).value) || 0
    const res = await manager.getTask(id)
    const assigned = res[2]
    ;(document.getElementById('assigned') as HTMLDivElement).innerText = 'Assigned Drone: ' + (assigned || '(none yet)')
  })
}
