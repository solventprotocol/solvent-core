import * as anchor from "@project-serum/anchor";
import { SOLVENT_TREASURY } from "../../constants";
import { getSolvent } from "../../utils";

/**
 * Claim balances from Solvent's PDAs to Solvent's treasury
 * @param provider Anchor provider
 * @returns Promise to the transaction signature
 */
export const claimBalance = async (
  provider: anchor.AnchorProvider
): Promise<anchor.web3.TransactionSignature> => {
  const solvent = getSolvent(provider);

  const transaction = new anchor.web3.Transaction();

  // Claim balance
  transaction.add(
    await solvent.methods
      .claimBalance()
      .accounts({
        signer: provider.wallet.publicKey,
        solventTreasury: SOLVENT_TREASURY,
      })
      .instruction()
  );

  return await provider.sendAndConfirm(transaction);
};
