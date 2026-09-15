-- Alert email cooldown (Resend). Null means never sent.
ALTER TABLE "User" ADD COLUMN "lastAlertEmailAt" TIMESTAMP(3);
