import * as anchor from "@project-serum/anchor";
import {
  LAMPORTS_PER_DROPLET,
  LOCKERS_MAX_INTEREST_SCALER,
} from "../../constants/numbers";
import { getBucket } from "../buckets/get-bucket";
import { getLocker } from "./get-locker";

interface CalculateLoanResult {
  principalAmount: number;
  maxInterestPayable: number;
}

/**
 * Calculate the droplets and interest for locking the next NFT into locker
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the bucket
 * @param duration: number
 * @returns Promise resolving to CalculateLoanResult object containting details on the loan
 */
export const calculateLoan = async (
  connection: anchor.web3.Connection,
  dropletMint: anchor.web3.PublicKey,
  duration: number
): Promise<CalculateLoanResult> => {
  const bucketState = await getBucket(connection, dropletMint);

  if (!bucketState.isLockingEnabled) {
    return {
      principalAmount: 0,
      maxInterestPayable: 0,
    };
  }

  const x = bucketState.numNftsInBucket;
  const y = bucketState.numNftsInLockers + 1;
  const maxLockerDuration = bucketState.maxLockerDuration.toNumber();

  const numerator = y * duration * 100 * LAMPORTS_PER_DROPLET;
  const denominator = maxLockerDuration * (x + y);
  const rawInterest = numerator / denominator;

  const scaledInterest =
    (rawInterest * bucketState.interestScaler) / LOCKERS_MAX_INTEREST_SCALER;

  const maxDropletsPerNft = 100 * LAMPORTS_PER_DROPLET;

  const principalAmount = maxDropletsPerNft - rawInterest;

  // Return the result
  return {
    principalAmount: principalAmount,
    maxInterestPayable: scaledInterest,
  };
};

/**
 * Calculate the droplets and interest payable for unlocking the NFT from the locker
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the bucket
 * @param nftMint: NFT mint associated with the locked position
 * @returns Promise resolving to repayment amount
 */
export const calculateRepayment = async (
  connection: anchor.web3.Connection,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey
) => {
  const lockerState = await getLocker(connection, dropletMint, nftMint);
  const creationTimestamp = lockerState.creationTimestamp.toNumber();
  const duration = lockerState.duration.toNumber();

  const currentTimestamp = Math.round(new Date().getTime() / 1000);
  const durationProportion = (currentTimestamp - creationTimestamp) / duration;

  return (
    lockerState.maxInterestPayable.toNumber() * durationProportion +
    lockerState.principalAmount.toNumber()
  );
};
