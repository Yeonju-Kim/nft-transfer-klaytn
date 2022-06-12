
const ethereumButton = document.querySelector('.enableEthereumButton');
const fileInput = document.getElementById("fileUpload");
const sendNFTButton = document.querySelector('.sendNFTButton');
let web3; 
let JsonInterface = null; 
// Chain ID of Cypress: 8217 

ethereumButton.addEventListener('click', async () => {
    ethereumButton.disabled = true;   
    ethereum
    .request({ method: 'eth_requestAccounts', params: [{ chainId: '0x2019' }],})
    .then(async (result) =>{ 
        if (ethereum.chainId != '0x2019') {
            try {
                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: `0x2019` }], // chainId must be in hexadecimal numbers
                });
            } catch {
                console.log('Network is not added. ')
            }
        }
        
        web3 = new Web3(ethereum);
        console.log(result)
    })
    .catch((error) => {
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log('Please connect to MetaMask.');
      } else {
        console.error(error);
      }
    });
});

sendNFTButton.addEventListener('click', async() =>{
    const contractAddress = document.getElementById('ContractAddress').value;
    const tokenID = document.getElementById('TokenID').value;
    const toAddress = document.getElementById('ReceiverAddress').value; 
    
    if (contractAddress === '' || tokenID === '' || toAddress === '')
    {
        console.log('Empty input field!')
        return; 
    }
    
    console.log(contractAddress, tokenID, toAddress)
    await sendTransaction(contractAddress, toAddress, 1965466615)
})


fileInput.onchange = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = function (event) {
    console.log(event.target.result)
        JsonInterface = JSON.parse(event.target.result)
    };
};

// Send Transaction to transfer NFT 
async function sendTransaction(contractAddress,toAddress,tokenID) {
    if (web3 === undefined)
    {
        console.log('web3 is undefined!')
        return;
    }
    sendNFTButton.disabled = true; 
    const caver = new Caver("https://public-node-api.klaytnapi.com/v1/cypress");    
    if (JsonInterface === null)
    {
        console.log("Use kip17 jsonInterface.")
        JsonInterface = await (new caver.kct.kip17()).options.jsonInterface;
    }

    const accounts = await web3.eth.getAccounts()
    const myAccount = accounts[0];
    const nftContractReadonly = new web3.eth.Contract(JsonInterface, contractAddress).methods.safeTransferFrom(
        myAccount, toAddress, tokenID 
    ).send({from: myAccount, gasPrice: 250000000000})
    .then((response)=>{
        console.log(response)
        sendNFTButton.disabled = false; 
    })
    .catch((err)=>{
        console.log(err)
        sendNFTButton.disabled = false; 
    })
}