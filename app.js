let provider, signer, contract;
const contractAddress = '0x95b41018eE5682129004E70d995722271f071814';
const customABI = ['function bookTicket(string memory from, string memory to, uint256 date) public payable',
                  'function refundTicket(uint256 ticketId) public',
                  'function getTickets() public view returns (string[] memory)'];

async function connectWallet() {
    try {
        showLoading();
        if (typeof window.ethereum !== 'undefined') {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, customABI, signer);
            
            const address = await signer.getAddress();
            const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'No Address Connected';
            console.log(`Connected: ${displayAddress}`);
            const container = document.getElementById('connectWallet');
            container.textContent = 'Connected';
            // Check if on correct network
            const network = await provider.getNetwork();
            if (network.chainId !== 1) { // Ethereum Mainnet
                await switchNetwork();
            }
        } else {
            alert('Please install MetaMask to use this dApp!');
        }
    } catch (error) {
        console.error(error);
        alert('Failed to connect wallet: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }], // Ethereum Mainnet
        });
    } catch (error) {
        console.error(error);
        alert('Please switch to Ethereum Mainnet');
    }
}

async function searchFlights() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const date = document.getElementById('date').value;
    
    if (!from || !to || !date) {
        alert('Please fill all fields');
        return;
    }

    // Mock flight data
    const flights = [
        {id: 1, airline: 'Web3Air', departure: '09:00', arrival: '11:00', price: '0.1'},
        {id: 2, airline: 'CryptoJet', departure: '13:00', arrival: '15:00', price: '0.15'},
        {id: 3, airline: 'BlockchainAir', departure: '18:00', arrival: '20:00', price: '0.12'}
    ];

    const flightsList = document.getElementById('flightsList');
    flightsList.innerHTML = '';
    
    flights.forEach(flight => {
        const flightCard = document.createElement('div');
        flightCard.className = 'neumorphic p-4';
        flightCard.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold">${flight.airline}</h3>
                    <p class="text-sm text-gray-600">Departure: ${flight.departure} - Arrival: ${flight.arrival}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold">${flight.price} ETH</p>
                    <button onclick="bookFlight(${flight.id}, '${flight.price}')" 
                            class="neumorphic px-4 py-1 text-blue-600 mt-2">
                        Book Now
                    </button>
                </div>
            </div>
        `;
        flightsList.appendChild(flightCard);
    });

    document.getElementById('flightResults').classList.remove('hidden');
}

async function bookFlight(flightId, price) {
    if (!provider || !signer) {
        alert('Please connect your wallet first');
        return;
    }

    try {
        showLoading();
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        const date = new Date(document.getElementById('date').value).getTime();

        const tx = await contract.bookTicket(from, to, date, {
            value: ethers.utils.parseEther(price)
        });
        
        await tx.wait();
        
        showBookingConfirmation(flightId, price);
    } catch (error) {
        console.error(error);
        alert('Booking failed: ' + error.message);
    } finally {
        hideLoading();
    }
}

function showBookingConfirmation(flightId, price) {
    const bookingDetails = document.getElementById('bookingDetails');
    bookingDetails.innerHTML = `
        <p><strong>Flight ID:</strong> ${flightId}</p>
        <p><strong>From:</strong> ${document.getElementById('from').value}</p>
        <p><strong>To:</strong> ${document.getElementById('to').value}</p>
        <p><strong>Date:</strong> ${document.getElementById('date').value}</p>
        <p><strong>Price:</strong> ${price} ETH</p>
        <button onclick="requestRefund(${flightId})" class="neumorphic px-6 py-2 text-red-600 mt-4">
            Request Refund
        </button>
    `;
    document.getElementById('bookingConfirmation').classList.remove('hidden');
}

async function requestRefund(ticketId) {
    try {
        showLoading();
        const tx = await contract.refundTicket(ticketId);
        await tx.wait();
        alert('Refund requested successfully!');
        document.getElementById('bookingConfirmation').classList.add('hidden');
    } catch (error) {
        console.error(error);
        alert('Refund failed: ' + error.message);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function () {
        window.location.reload();
    });

    window.ethereum.on('chainChanged', function () {
        window.location.reload();
    });
}