import * as anchor from "@project-serum/anchor";
import { getSolvent } from "../../utils";

/**
 * Admin only: Enable or disable NFT auto-staking feature for a bucket
 * @param provider Anchor provider
 * @param enable Whether you wanna enable or disable
 * @returns Promise resolving to the transaction signature
 */
export const setStakingEnabled = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  enable?: boolean
) => {
  const solvent = getSolvent(provider);

  return await solvent.methods
    .setStakingEnabled(enable)
    .accounts({
      signer: provider.wallet.publicKey,
      dropletMint,
    })
    .rpc();
};
