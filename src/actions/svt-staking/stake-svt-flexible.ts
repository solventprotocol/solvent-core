import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token-latest";
import {
  FLEXIBLE_TOKEN_STAKING_PROGRAM_ID,
  SVT_MINT,
  XSVT_MINT,
} from "../../constants";
import { getFlexibleSvtStaking } from "../../utils";

export const stakeSvtFlexible = async (
  provider: anchor.AnchorProvider,
  amount: number,
  svtTokenAccount?: anchor.web3.PublicKey,
  xsvtTokenAccount?: anchor.web3.PublicKey
) => {
  const transaction = new anchor.web3.Transaction();

  const flexibleSvtStaking = getFlexibleSvtStaking(provider);

  // Use wallet's ATA as the token account if not passed as argument
  if (!svtTokenAccount) {
    svtTokenAccount = await getAssociatedTokenAddress(
      SVT_MINT,
      provider.wallet.publicKey
    );
  }

  // Use wallet's ATA as the token account if not passed as argument
  if (!xsvtTokenAccount) {
    svtTokenAccount = await getAssociatedTokenAddress(
      XSVT_MINT,
      provider.wallet.publicKey
    );
  }

  // Create token vault PDA
  const [tokenVault, tokenVaultBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [SVT_MINT.toBuffer()],
      FLEXIBLE_TOKEN_STAKING_PROGRAM_ID
    );

  // Stake SVT and get XSVT in return

  transaction.add(
    await flexibleSvtStaking.methods
      .stake(tokenVaultBump, new anchor.BN(amount))
      .accounts({
        tokenMint: SVT_MINT,
        xTokenMint: XSVT_MINT,
        tokenFrom: svtTokenAccount,
        tokenFromAuthority: provider.wallet.publicKey,
        tokenVault,
        xTokenTo: xsvtTokenAccount,
      })
      .instruction()
  );

  return await provider.sendAndConfirm(transaction);
};
