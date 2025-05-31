import React, { useEffect } from "react";
import { useAtom } from 'jotai';
import { BrowserProvider, formatEther } from "ethers";
import { Button, Card, Typography, Space, message, Avatar } from "antd";
import { CopyOutlined, WalletOutlined } from "@ant-design/icons";
import blockies from "ethereum-blockies-base64";
import {
  walletAddressAtom,
  walletBalanceAtom,
  walletNetworkAtom,
  isWalletConnectedAtom,
} from '../jotai/atoms';

const { Title } = Typography;

function WalletCon() {
  const [walletAddress, setWalletAddress] = useAtom(walletAddressAtom);
  const [ethBalance, setEthBalance] = useAtom(walletBalanceAtom);
  const [networkName, setNetworkName] = useAtom(walletNetworkAtom);
  const [isConnected, setIsConnected] = useAtom(isWalletConnectedAtom);

  const loadWalletData = async () => {
    if (!window.ethereum) return;

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    setWalletAddress(address);
    setEthBalance(formatEther(balance));
    setNetworkName(network.name);
    setIsConnected(true);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        await loadWalletData();
      } catch (err) {
        console.error("Connection error:", err);
      }
    } else {
      alert("Please install MetaMask.");
    }
  };

  const trimEth = (ethStr) => {
    const num = parseFloat(ethStr);
    return num.toFixed(6) || "";
  };

  // 🔁 Detect network change in MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => {
        console.log("Network changed");
        loadWalletData(); // Refresh data on chain change
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      // Clean up on component unmount
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    message.success("Address copied!");
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        {!walletAddress ? (
          <Button
            type="primary"
            icon={<WalletOutlined />}
            onClick={connectWallet}
          >
            Connect Wallet
          </Button>
        ) : (
          <Card
            size="small"
            style={{ maxWidth: 300 }}
            bodyStyle={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 36px" }}
          >
            <Typography strong>{networkName}</Typography>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Avatar
                size="large"
                src={blockies(walletAddress)}
                alt="Wallet Avatar"
              />
              <Space>
                <Typography code>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </Typography>
                <CopyOutlined onClick={copyAddress} style={{ cursor: "pointer" }} />
              </Space>
              <Title level={2} style={{margin: 0, padding: 0, }}>{trimEth(ethBalance)} ETH</Title>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default WalletCon;
