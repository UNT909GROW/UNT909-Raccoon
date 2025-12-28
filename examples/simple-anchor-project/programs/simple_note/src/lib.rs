use anchor_lang::prelude::*;

declare_id!("SmplNote1111111111111111111111111111111111");

#[program]
pub mod simple_note {
    use super::*;

    pub fn create_note(
        ctx: Context<CreateNote>,
        title: String,
        body: String,
    ) -> Result<()> {
        require!(title.len() <= 64, SimpleNoteError::TitleTooLong);
        require!(body.len() <= 512, SimpleNoteError::BodyTooLong);

        let note = &mut ctx.accounts.note;
        note.owner = ctx.accounts.authority.key();
        note.title = title;
        note.body = body;
        note.bump = *ctx.bumps.get("note").unwrap();

        emit!(NoteCreated {
            owner: note.owner,
            title: note.title.clone(),
        });

        Ok(())
    }

    pub fn update_note(
        ctx: Context<UpdateNote>,
        new_title: Option<String>,
        new_body: Option<String>,
    ) -> Result<()> {
        let note = &mut ctx.accounts.note;

        require_keys_eq!(note.owner, ctx.accounts.authority.key(), SimpleNoteError::Unauthorized);

        if let Some(t) = new_title {
            require!(t.len() <= 64, SimpleNoteError::TitleTooLong);
            note.title = t;
        }

        if let Some(b) = new_body {
            require!(b.len() <= 512, SimpleNoteError::BodyTooLong);
            note.body = b;
        }

        emit!(NoteUpdated {
            owner: note.owner,
            title: note.title.clone(),
        });

        Ok(())
    }

    pub fn close_note(ctx: Context<CloseNote>) -> Result<()> {
        let note = &ctx.accounts.note;
        require_keys_eq!(note.owner, ctx.accounts.authority.key(), SimpleNoteError::Unauthorized);

        emit!(NoteClosed {
            owner: note.owner,
            title: note.title.clone(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateNote<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Note::MAX_SIZE,
        seeds = [b"note", authority.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub note: Account<'info, Note>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateNote<'info> {
    #[account(mut)]
    pub note: Account<'info, Note>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseNote<'info> {
    #[account(
        mut,
        close = authority
    )]
    pub note: Account<'info, Note>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
pub struct Note {
    pub owner: Pubkey,
    pub title: String,
    pub body: String,
    pub bump: u8,
}

impl Note {
    pub const MAX_SIZE: usize =
        32 + // owner
        4 + 64 + // title (len + data)
        4 + 512 + // body
        1; // bump
}

#[event]
pub struct NoteCreated {
    pub owner: Pubkey,
    pub title: String,
}

#[event]
pub struct NoteUpdated {
    pub owner: Pubkey,
    pub title: String,
}

#[event]
pub struct NoteClosed {
    pub owner: Pubkey,
    pub title: String,
}

#[error_code]
pub enum SimpleNoteError {
    #[msg("Title is too long")]
    TitleTooLong,
    #[msg("Body is too long")]
    BodyTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
}
