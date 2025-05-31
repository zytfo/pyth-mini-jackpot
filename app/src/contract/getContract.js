import { ethers } from 'ethers';
import { GameABI } from "./contractABI";

export const getContract = (signerOrProvider) => {
  const CONTRACT_ADDRESS = '0xabA49a76D7097d250E22C05c420A527D366dA1F4';
  return new ethers.Contract(CONTRACT_ADDRESS, GameABI, signerOrProvider);
};