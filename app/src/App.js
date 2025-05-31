import './App.css';
import React, { useState, useEffect } from "react";
import WalletCon from './components/Wallet';
import pythLogo from './pyth_logo.svg';
import { getContract } from './contract/getContract';
import { ethers, WebSocketProvider, BrowserProvider, randomBytes } from 'ethers';

import { useAtomValue } from 'jotai';

import {
  walletAddressAtom,
  walletBalanceAtom,
  walletNetworkAtom,
  isWalletConnectedAtom,
} from './jotai/atoms';

const wssLink = process.env.REACT_APP_WSS_LINK;

function App() {
  const network = useAtomValue(walletNetworkAtom);
  const isConnected = useAtomValue(isWalletConnectedAtom);

  const [entries, setEntries] = useState([]);
  const [jackpotResult, setJackpotResults] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [moneyToSpend, setMoneyToSpend] = useState("");

  useEffect(() => {
    if (!window.ethereum || !isConnected) return;

    let contract;

    const setupListener = async () => {
      const provider = new WebSocketProvider(wssLink);
      contract = getContract(provider);
      contract.on('JackpotResult', (_, userAddress, didWin, prize, rnd) => {
        console.log(userAddress, didWin, prize, rnd);
        setJackpotResults({
          userAddress,
          didWin,
          prize: ethers.formatEther(prize)
        });

        // if (didWin) {
        //   setPrizePool(0);
        // } else {
        //   setPrizePool( prev => parseFloat(prev) + 0.005);
        // }
      });

      contract.on('JackpotEntered', (_, newPlayerAddress) => {
        setEntries((oldEntries) => [newPlayerAddress, ...oldEntries])
      });
    };

    setupListener();

    return () => {
      // Clean up the listener on unmount
      if (contract) {
        contract.removeAllListeners('JackpotEntered');
        contract.removeAllListeners('JackpotResult');
      }
    };
  }, [isConnected]);

  const fetchPool = async () => {
    if (window.ethereum && isConnected) {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      try {
        const result = await contract.jackpotPool();

        const formatted = ethers.formatEther(result);

        setPrizePool(parseFloat(formatted).toFixed(8));
      } catch (err) {
        console.error('Contract call failed:', err);
      }
    }
  }

  useEffect(()=> {
    fetchPool();
  }, [isConnected])
  
  const play = async () => {
      if (window.ethereum && isConnected) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = getContract(signer);

        try {
          const overrides = {
            value: ethers.parseEther(moneyToSpend.toString())
          };
          
          
          const userRandomNumber = randomBytes(32);

          const result = await contract.play(userRandomNumber, overrides);
          console.log(result);
        } catch (err) {
          console.error('Contract call failed:', err);
        }
      }
  };

  const handleChange = (e) => {
    setMoneyToSpend(e.target.value);
  };

  return (
    <div className="game-container">
      <WalletCon />

      <div className="game-core">
        <img src={pythLogo} height={72} alt="pyth-logo"/>
        <h1 className="game-title">Mini Jackpot</h1>
        {!isConnected && <div className="no-wallet">Connect your wallet to play the game!</div>}
        {isConnected && (network === "arbitrum-sepolia" ? <>
          <div className="prizepool-container">
            Current Prize Pool is:
            {prizePool && <div className="game-number">{prizePool} ETH</div>}
          </div>

          {jackpotResult && 
            <div className="game-result">
              You
              <div className={jackpotResult.didWin ? "game-won" : "game-lost"}>{jackpotResult.didWin ? "WON" : "LOST"}</div>
              {jackpotResult.didWin && (<div className="prize-money">You won {jackpotResult.prize} ETH</div>)}
            </div>
          }
          <div className="game-input">
            <input 
              className="neon-input" 
              placeholder="Enter amount of ETH" 
              value={moneyToSpend}
              onChange={handleChange} 
            />
            <button className="neon-button" onClick={play} >
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              Play now!
            </button>
          </div>

          <div className="entries">
            {entries.map((entry, index)=>(
              <div className="game-subtext" key={index}>
                {entry.slice(0, 6)}...{entry.slice(-4)} has entered the game!
              </div>
            ))}
          </div>
          {/* <p className="game-subtext">Click to power up</p> */}
        </> : 
          <div className="no-wallet">Switch your chain to Arbitrum Sepolia</div>)}
      </div>
    </div>
  );
}

export default App;
