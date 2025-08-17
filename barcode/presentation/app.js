// Deployed to local Hardhat node in this environment (updated automatically)
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// Minimal ABI covering used functions/events (match contract: producer is an address)
const ABI = [
  "function registerProduct(string barcode, string productName, address producer)",
  "function verifyProduct(string barcode) view returns (bool, string, address)",
  "function owner() view returns (address)",
  "function addProducer(address producer, string name)",
  "function removeProducer(address producer)",
  "event ProductRegistered(string barcode, string productName, address producer)",
  "event ProducerAdded(address producer, string name)",
  "event ProducerRemoved(address producer)"
];

let provider, signer, contract;

function formatError(e) {
  if (!e) return 'unknown error';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  if (e.reason) return e.reason;
  if (e.error && e.error.message) return e.error.message;
  try { return JSON.stringify(e); } catch (_) { return String(e); }
}

async function ensureEthers() {
  if (window.ethers) return;
  // ethers is bundled locally as ethers.min.js in the presentation folder and
  // is loaded by index.html. If it's still missing, report an error.
  throw new Error('ethers.js not found on page');
}

async function ensureLocalNetwork(provider) {
  // Hardhat default chain id
  const TARGET_CHAIN_ID_HEX = '0x7a69'; // 31337
  try {
    const current = await provider.send('eth_chainId', []);
    if (current === TARGET_CHAIN_ID_HEX) return true;

    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: TARGET_CHAIN_ID_HEX }]);
      return true;
    } catch (switchError) {
      // 4902 = chain not added
      if (switchError && (switchError.code === 4902 || switchError.message && switchError.message.includes('4902'))) {
        await provider.send('wallet_addEthereumChain', [{
          chainId: TARGET_CHAIN_ID_HEX,
          chainName: 'Hardhat Localhost',
          rpcUrls: ['http://127.0.0.1:8545'],
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        }]);
        // try switching again
        await provider.send('wallet_switchEthereumChain', [{ chainId: TARGET_CHAIN_ID_HEX }]);
        return true;
      }
      throw switchError;
    }
  } catch (err) {
    console.error('Network switch failed', err);
    return false;
  }
}

async function connect() {
  try {
    await ensureEthers();
  } catch (e) {
    document.getElementById('output').textContent = 'Failed to load ethers.js';
    return;
  }
  if (!window.ethereum) {
    document.getElementById('output').textContent = 'No Ethereum provider found (install MetaMask)';
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  try {
    await provider.send('eth_requestAccounts', []);
  } catch (e) {
    document.getElementById('output').textContent = 'User rejected account access';
    return;
  }
  signer = provider.getSigner();

  // Ensure the user is on the local Hardhat network (prompt MetaMask to switch/add)
  const switched = await ensureLocalNetwork(provider);
  if (!switched) {
    document.getElementById('output').textContent = 'Please switch MetaMask to Localhost:8545 (chainId 31337)';
    // still continue to try to create contract so user can at least see errors
  }

  try {
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  } catch (e) {
  document.getElementById('output').textContent = 'Failed to create contract instance: ' + formatError(e);
    return;
  }

  const addr = await signer.getAddress();
  document.getElementById('output').textContent = 'Connected: ' + addr;

  // show network and owner, and disable register if not owner or wrong network
  try {
    const network = await provider.getNetwork();
    const statusEl = document.getElementById('status');
    statusEl.textContent = `Network: ${network.chainId}`;
    if (network.chainId !== 31337) {
      statusEl.style.color = 'orangered';
      statusEl.textContent += ' — switch to Localhost 8545 (chainId 31337)';
    } else {
      statusEl.style.color = 'green';
    }
  } catch (e) {
    console.warn('Failed to get network', e);
  }

  // get contract owner
  try {
    const ownerAddr = await contract.owner();
    const ownerEl = document.getElementById('owner');
    if (ownerEl) ownerEl.textContent = `Owner: ${ownerAddr}`;
    // enable/disable register button
    const registerBtn = document.getElementById('register');
    if (registerBtn) {
      const force = document.getElementById('forceEnable') && document.getElementById('forceEnable').checked;
      if (force) {
        registerBtn.disabled = false;
      } else if (addr.toLowerCase() === ownerAddr.toLowerCase()) {
        registerBtn.disabled = false;
      } else {
        registerBtn.disabled = true;
      }
    }
  } catch (e) {
  console.warn('Failed to read owner', e);
  }
  // refresh lists
  refreshLists();
}

async function refreshLists() {
  const productsEl = document.getElementById('productsList');
  const producersEl = document.getElementById('producersList');
  if (!productsEl || !producersEl || !contract) return;
  productsEl.innerHTML = '';
  producersEl.innerHTML = '';

  // Query past ProductRegistered events
  try {
    const prodEvents = await contract.queryFilter(contract.filters.ProductRegistered());
    prodEvents.forEach(ev => {
      const { barcode, productName, producer } = ev.args;
      const li = document.createElement('li');
      li.textContent = `${barcode} — ${productName} — producer: ${producer}`;
      productsEl.appendChild(li);
    });
  } catch (e) {
  console.warn('Failed to fetch product events', e);
  }

  try {
    const addEvents = await contract.queryFilter(contract.filters.ProducerAdded());
    addEvents.forEach(ev => {
      const { producer, name } = ev.args;
      const li = document.createElement('li');
      li.textContent = `${producer} — ${name}`;
      producersEl.appendChild(li);
    });
  } catch (e) {
  console.warn('Failed to fetch producer events', e);
  }
}

async function register() {
  const barcode = document.getElementById('barcode').value;
  const name = document.getElementById('name').value;
  const producer = document.getElementById('producer').value;
  if (!contract) { document.getElementById('output').textContent = 'Not connected'; return; }
  try {
    const tx = await contract.registerProduct(barcode, name, producer);
    document.getElementById('output').textContent = 'Tx sent: ' + tx.hash;
    await tx.wait();
    document.getElementById('output').textContent = 'Registered: ' + tx.hash;
  } catch (e) {
  console.error('register error', e);
  document.getElementById('output').textContent = 'Error: ' + formatError(e);
  }
}

async function verify() {
  const barcode = document.getElementById('barcodeVerify').value;
  if (!contract) { document.getElementById('output').textContent = 'Not connected'; return; }
  try {
    const res = await contract.verifyProduct(barcode);
    document.getElementById('output').textContent = JSON.stringify(res);
  } catch (e) {
  console.error('verify error', e);
  document.getElementById('output').textContent = 'Error: ' + formatError(e);
  }
}

window.addEventListener('load', () => {
  document.getElementById('connect').onclick = connect;
  document.getElementById('register').onclick = register;
  document.getElementById('verify').onclick = verify;
  const f = document.getElementById('forceEnable');
  if (f) f.addEventListener('change', () => {
    const registerBtn = document.getElementById('register');
    if (registerBtn) registerBtn.disabled = !f.checked ? registerBtn.disabled : false;
  });
  const addBtn = document.getElementById('addProducer');
  if (addBtn) addBtn.addEventListener('click', addProducerHandler);
  const removeBtn = document.getElementById('removeProducer');
  if (removeBtn) removeBtn.addEventListener('click', removeProducerHandler);
  const useMy = document.getElementById('useMyAddress');
  if (useMy) useMy.addEventListener('change', () => {
    const prod = document.getElementById('producer');
    if (useMy.checked && signer) {
      signer.getAddress().then(a => prod.value = a).catch(()=>{});
    } else if (!useMy.checked) {
      prod.value = '';
    }
  });
  const ref = document.getElementById('refresh');
  if (ref) ref.addEventListener('click', refreshLists);
});

async function addProducerHandler() {
  if (!contract) { document.getElementById('output').textContent = 'Not connected'; return; }
  const addr = document.getElementById('producerAddr').value;
  const name = document.getElementById('producerDisplayName').value || '';
  try {
    const tx = await contract.addProducer(addr, name);
    document.getElementById('output').textContent = 'AddProducer tx: ' + tx.hash;
    await tx.wait();
    document.getElementById('output').textContent = 'Producer added';
  } catch (e) {
  console.error('addProducer error', e);
  document.getElementById('output').textContent = 'Error: ' + formatError(e);
  }
}

async function removeProducerHandler() {
  if (!contract) { document.getElementById('output').textContent = 'Not connected'; return; }
  const addr = document.getElementById('producerAddr').value;
  try {
    const tx = await contract.removeProducer(addr);
    document.getElementById('output').textContent = 'RemoveProducer tx: ' + tx.hash;
    await tx.wait();
    document.getElementById('output').textContent = 'Producer removed';
  } catch (e) {
  console.error('removeProducer error', e);
  document.getElementById('output').textContent = 'Error: ' + formatError(e);
  }
}
