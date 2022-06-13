
const ethereumButton = document.querySelector('.enableEthereumButton');
const fileInput = document.getElementById("fileUpload");
const sendNFTButton = document.querySelector('.sendNFTButton');
const showNFTButton = document.querySelector('.showNFT');
const leftButton = document.getElementById('prev');
const rightButton = document.getElementById('next');

let web3;
let JsonInterface = null; 
let tokenIDlist;
let page = 0;
let totalBalance;
const numOfNFTs = 3; 
const caver = new Caver("https://public-node-api.klaytnapi.com/v1/cypress");
let myAccount;

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
        myAccount = result[0];
        document.getElementById('myAccountAddress').innerHTML =`Wallet Address: ${myAccount}`;
        web3 = new Web3(ethereum);
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

function setEvents(){
    for (let i = 0 ; i < numOfNFTs ; i++)
    {
        document.getElementById(`${i+1}`).addEventListener('click', ()=>{
            document.getElementById('TokenID').value = tokenIDlist[i];
        })
    }
    
    leftButton.addEventListener('click', async()=>{
        if (page == 0)
        {
            return;
        }    
        else{
            page -= 1;
            await updateNFTImage(page*numOfNFTs); 
        }
    })
    rightButton.addEventListener('click', async()=>{
        if ((page+1) * numOfNFTs >= totalBalance)
        {
            return;
        }    
        else{
            page += 1;
            await updateNFTImage(page*numOfNFTs); 
        }
    })
}

async function updateNFTImage(index){
    const contractAddress = document.getElementById('ContractAddress').value;
    if (contractAddress === "")
    {
        console.log('Address has not set yet.')
        return;
    }

    if (JsonInterface === null)
    {
        console.log("Use kip17 jsonInterface.")
        JsonInterface = await (new caver.kct.kip17()).options.jsonInterface;
    }

    const nftContract = new web3.eth.Contract(JsonInterface, contractAddress)
    totalBalance = await nftContract.methods.balanceOf(myAccount).call({from: myAccount })

    tokenIDlist = []
    let tokenURIList = []
    for (let i = 0; i < numOfNFTs ; i++)
    {
        if((i+index) < totalBalance)
        {
            tokenIDlist.push(await nftContract.methods.tokenOfOwnerByIndex(myAccount, i+index).call({from: myAccount}))
            tokenURIList.push(await nftContract.methods.tokenURI(tokenIDlist[i]).call({from: myAccount}))
        }
    }

    for (let i = 0 ; i < numOfNFTs ; i ++ )
    {
        if ((i + index) < totalBalance) 
        {
            document.getElementById(`${i+1}`).style.display="inline"
            await fetch(tokenURIList[i])
            .then(response => response.json())
            .then((data) => {
                document.getElementById(`${i+1}`).src= data.image;
            });
        }
        else{
            document.getElementById(`${i+1}`).style.display="none"
        }
    }
}

showNFTButton.addEventListener('click', async()=>{
    const contractAddress = document.getElementById('ContractAddress').value;
    if (contractAddress === "")
    {
        console.log('Address has not set yet.')
        return;
    }
    document.getElementById('NFTs').style.display = "inline"
    setEvents();
    page = 0;
    await updateNFTImage(page);
})

sendNFTButton.addEventListener('click', async() =>{
    const contractAddress = document.getElementById('ContractAddress').value;
    const tokenID = document.getElementById('TokenID').value;
    const toAddress = document.getElementById('ReceiverAddress').value; 
    
    if (contractAddress === '' || tokenID === '' || toAddress === '')
    {
        console.log('Empty input field!')
        return; 
    }
    
    await sendTransaction(contractAddress, toAddress, tokenID)
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
async function sendTransaction(contractAddress, toAddress, tokenID) {
    if (web3 === undefined)
    {
        console.log('web3 is undefined!')
        return;
    }
    sendNFTButton.disabled = true; 
    if (JsonInterface === null)
    {
        console.log("Use kip17 jsonInterface.")
        JsonInterface = await (new caver.kct.kip17()).options.jsonInterface;
    }
    
    const nftContract = new web3.eth.Contract(JsonInterface, contractAddress)
    await nftContract.methods.safeTransferFrom(
        myAccount, toAddress, tokenID 
    ).send({from: myAccount, gasPrice: '250000000000'})
    .then((response)=>{
        console.log(response)
        sendNFTButton.disabled = false; 
    })
    .catch((err)=>{
        console.log(err)
        sendNFTButton.disabled = false; 
    })
}