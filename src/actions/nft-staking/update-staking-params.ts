import * as anchor from "@project-serum/anchor";
import { getSolvent } from "../../utils";

/**
 * Admin only: Update configurable params of NFT auto-staking feature for a bucket
 * @param provider Anchor provider
 * @param dropletMint Droplet mint associated with the bucket
 * @param gembankProgram Program ID of the Gem Bank program
 * @param gemfarmProgram Program ID of the Gem Farm program
 * @param farm Gem Farm address
 * @param feeAccount Gem Farm fee account
 * @returns Promise resolving to the transaction signature
 */
export const updateStakingParams = async (
  provider: anchor.AnchorProvider,
  dropletMint: anchor.web3.PublicKey,
  gembankProgram: anchor.web3.PublicKey,
  gemfarmProgram: anchor.web3.PublicKey,
  farm: anchor.web3.PublicKey,
  feeAccount: anchor.web3.PublicKey
) => {
  const solvent = getSolvent(provider);

  return await solvent.methods
    .updateStakingParams()
    .accounts({
      signer: provider.wallet.publicKey,
      dropletMint,
      gemworksFarm: farm,
      gemfarmProgram,
      gembankProgram,
      gemworksFeeAccount: feeAccount,
    })
    .rpc();
};
