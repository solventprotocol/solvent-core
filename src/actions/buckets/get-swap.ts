import * as anchor from "@project-serum/anchor";
import { getSwapState, getSolvent } from "../../utils";

/**
 * Fetch SwapState account contents
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the collection
 * @param signer Signer whose swap state is to be checked
 * @returns Promise resolving to the SwapState account contents
 */
export const getSwap = async (
  connection: anchor.web3.Connection,
  dropletMint: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  const swapStateAddress = await getSwapState(dropletMint, signer);
  return await solvent.account.swapState.fetch(swapStateAddress);
};

/**
 * Fetch all SwapState accounts, optionally filtering by signer
 * @param connection Solana Web3 connection object
 * @param signer Signer whose swap state is to be checked
 * @returns Promise resolving to the the list of SwapState accounts
 */
export const getAllSwaps = async (
  connection: anchor.web3.Connection,
  signer?: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  if (signer) {
    return await solvent.account.swapState.all([
      {
        memcmp: {
          offset: 9,
          bytes: signer.toBase58(),
        },
      },
    ]);
  } else {
    return await solvent.account.swapState.all();
  }
};
