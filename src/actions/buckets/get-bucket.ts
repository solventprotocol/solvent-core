import * as anchor from "@project-serum/anchor";
import { getBucketState, getSolvent } from "../../utils";

/**
 * Fetch BucketState account contents
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the bucket
 * @returns Promise resolving to the BucketState account contents
 */
export const getBucket = async (
  connection: anchor.web3.Connection,
  dropletMint: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  const bucketAddress = await getBucketState(dropletMint);
  return await solvent.account.bucketStateV3.fetch(bucketAddress);
};

/**
 * Fetch all BucketState accounts and their contents
 * @param connection Solana Web3 connection object
 * @returns Promise resolving to the BucketState account contents
 */
export const getAllBuckets = async (connection: anchor.web3.Connection) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  return await solvent.account.bucketStateV3.all();
};
