import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import contractAbi from "../artifacts/contracts/Domains.sol/Domains.json";
import "./App.css";
import twitterLogo from "../assets/twitter-logo.svg";
import polygonLogo from "../assets/polygonlogo.png";
import ethLogo from "../assets/ethlogo.png";
import { networks } from "../utils/networks";
import type { Domains } from "../typechain/Domains";

// Constants
const TWITTER_HANDLE = "brett_jackson";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = ".poly";
const CONTRACT_ADDRESS = "0x619a19230a120e420782b8c7ce47e84b86ce2554";

const validNetworks = ["Polygon Mumbai Testnet", "Hardhat Network"];

const networkToUse = "0x539";

interface MintRecord {
  id: number;
  name: string;
  record: string;
  owner: string;
}

const App = () => {
  // Create a stateful variable to store the network next to all the others
  const [network, setNetwork] = useState("");

  const [currentAccount, setCurrentAccount] = useState("");
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mints, setMints] = useState<MintRecord[]>([]);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });

    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // This is the new part, we check the user's network chain ID
      const chainId = (await ethereum.request({
        method: "eth_chainId",
      })) as keyof typeof networks;
      setNetwork(networks[chainId]);

      // Reload the page when they change networks
      const handleChainChanged = (_chainId: keyof typeof networks) => {
        window.location.reload();
      };

      ethereum.on("chainChanged", handleChainChanged);
    } catch (error) {
      console.log(error);
    }
  };

  // Create a function to render if wallet is not connected yet
  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <img
        src="https://media.giphy.com/media/DxGrUuB4DZDApupGPV/giphy.gif"
        alt="Ninja gif"
      />
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    </div>
  );

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: networkToUse }], // Check networks.js for hexadecimal network ids
        });
      } catch (error: any) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: networkToUse,
                  chainName: "Polygon Mumbai Testnet",
                  // rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract: Domains = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        ) as Domains;
        console.log(contract);
        // Get all the domain names from our contract
        const names = await contract.getAllDomainNames();

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name: string) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const isValidNetwork = validNetworks.find((nt) => nt === network);

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract: Domains = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        ) as Domains;

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        showRecordUpdatedToast(domain, record);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const renderInputForm = () => {
    if (!isValidNetwork) {
      return (
        <div className="connect-wallet-container">
          <h2>Please switch to Polygon Mumbai Testnet</h2>
          {/* This button will call our switch network function */}
          <button className="cta-button mint-button" onClick={switchNetwork}>
            Click here to switch
          </button>
        </div>
      );
    }

    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="domain"
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={record}
          placeholder="who's ur daddy👨🏻? 😏😏😏"
          onChange={(e) => setRecord(e.target.value)}
        />
        {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
        {editing ? (
          <div className="button-container">

            <button
              className="cta-button mint-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set record
            </button>

            <button
              className="cta-button mint-button"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // If editing is not true, the mint button will be returned instead
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={mintDomain}
          >
            Mint
          </button>
        )}
      </div>
    );
  };

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract: Domains = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        ) as Domains;

        const price = await contract
          .connect(signer)
          .priceToRegisterDomain(domain);
        console.log("Minting domain", domain, "with price", price);
        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: price,
        });
        console.log(tx);
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          showDomainMintedToast(domain);

          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          showRecordUpdatedToast(domain, record);

          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Call fetchMints after 2 seconds
          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const editRecord = (name: string) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  }

  const showDomainMintedToast = (domainName: string) => {
    toast.success(`Domain minted: ${domainName}`);
  };

  const showRecordUpdatedToast = (domainName: string, record: string) => {
    toast.success(`Record updated for ${domainName}: ${record}`);
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="subtitle"> Recently minted domains!</p>
          <div className="mint-list">
            { mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className='mint-row'>
                    <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                      <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    { mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                      <button className="edit-button" onClick={() => editRecord(mint.name)}>
                        <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                      </button>
                      :
                      null
                    }
                  </div>
            <p> {mint.record} </p>
          </div>)
          })}
        </div>
      </div>);
    }
  };

  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
    (async () => {
      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as keyof typeof networks;
      setNetwork(networks[chainId]);
    })();
  }, []);

  useEffect(() => {
    if (isValidNetwork) {
      fetchMints();
    }
  }, [currentAccount, isValidNetwork]);

  return (
    <div className="App">
      <ToastContainer/>
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">🔷 Polygon Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
            {/* Display a logo and wallet connection status*/}
            <div className="right">
              <img
                alt="Network logo"
                className="logo"
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
              />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>

        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
