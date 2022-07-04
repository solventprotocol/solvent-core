import * as anchor from "@project-serum/anchor";
import { getSolvent } from "../../utils";

/**
 * Admin only: Update configurable params of NFT locking feature for a bucket
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param maxLockerDuration The max duration an NFT can be locked for
 * @param interestScaler Value which can be adjusted to adjust interest rates
 * @returns Promise resolving to the transaction signature
 */
export const updateLockingParams = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  maxLockerDuration?: anchor.BN,
  interestScaler?: number
) => {
  const solvent = getSolvent(provider);

  return await solvent.methods
    .updateLockingParams(maxLockerDuration, interestScaler)
    .accounts({
      signer: provider.wallet.publicKey,
      dropletMint,
    })
    .rpc();
};
