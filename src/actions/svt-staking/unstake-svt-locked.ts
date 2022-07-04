import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token-latest";
import { LOCKED_TOKEN_STAKING_PROGRAM_ID, SVT_MINT } from "../../constants";
import { getLockedSvtStaking } from "../../utils";

export const unstakeSvtLocked = async (
  provider: anchor.AnchorProvider,
  amount: number,
  svtTokenAccount?: anchor.web3.PublicKey
) => {
  const transaction = new anchor.web3.Transaction();
  const lockedSvtStaking = getLockedSvtStaking(provider);

  // Use wallet's ATA as the token account if not passed as argument
  if (!svtTokenAccount) {
    svtTokenAccount = await getAssociatedTokenAddress(
      SVT_MINT,
      provider.wallet.publicKey
    );
  }

  // Create PDAs
  const [tokenVault, tokenVaultBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [SVT_MINT.toBuffer()],
      LOCKED_TOKEN_STAKING_PROGRAM_ID
    );

  const [stakingAccount, stakingBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("staking")],
      LOCKED_TOKEN_STAKING_PROGRAM_ID
    );

  const [userStakingAccount, userStakingBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [provider.wallet.publicKey.toBuffer()],
      LOCKED_TOKEN_STAKING_PROGRAM_ID
    );

  // Unstake SVT
  transaction.add(
    await lockedSvtStaking.methods
      .unstake(
        tokenVaultBump,
        stakingBump,
        userStakingBump,
        new anchor.BN(amount)
      )
      .accounts({
        tokenMint: SVT_MINT,
        tokenTo: svtTokenAccount,
        xTokenFromAuthority: provider.wallet.publicKey,
        tokenVault,
        stakingAccount,
        userStakingAccount,
      })
      .instruction()
  );

  return await provider.sendAndConfirm(transaction);
};
