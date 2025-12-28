import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("simple_note", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SimpleNote as Program;

  const authority = provider.wallet.publicKey;

  it("creates, updates, and closes a note", async () => {
    const title = "hello";
    const [notePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("note"), authority.toBuffer(), Buffer.from(title)],
      program.programId
    );

    await program.methods
      .createNote(title, "world")
      .accounts({
        note: notePda,
        authority,
      })
      .rpc();

    let noteAccount = await program.account.note.fetch(notePda);
    assert.equal(noteAccount.title, title);
    assert.equal(noteAccount.body, "world");

    await program.methods
      .updateNote(null, "updated body")
      .accounts({
        note: notePda,
        authority,
      })
      .rpc();

    noteAccount = await program.account.note.fetch(notePda);
    assert.equal(noteAccount.body, "updated body");

    await program.methods
      .closeNote()
      .accounts({
        note: notePda,
        authority,
      })
      .rpc();
  });
});
