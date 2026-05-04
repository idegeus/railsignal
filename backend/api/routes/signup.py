from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.models import EmailSignup
from api.deps import get_db

router = APIRouter(prefix="/signup", tags=["signup"])


class SignupIn(BaseModel):
    email: EmailStr


@router.post("", status_code=201)
async def create_signup(body: SignupIn, db: AsyncSession = Depends(get_db)):
    stmt = (
        pg_insert(EmailSignup)
        .values(email=body.email)
        .on_conflict_do_nothing(index_elements=["email"])
    )
    await db.execute(stmt)
    await db.commit()
    return {"ok": True}
