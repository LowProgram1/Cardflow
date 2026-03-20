# Hostinger SSH Key Setup for Git Deploy

Use this guide to deploy your Laravel project to Hostinger using Git over SSH (no GitHub password prompts).

Repository example in this guide:
- `git@github.com:LowProgram1/Cardflow.git`

---

## 1) Generate an SSH key on Hostinger

SSH into your Hostinger account first:

```bash
ssh -p 65002 u845249598@82.25.87.4
```

Then generate a deploy key:

```bash
mkdir -p ~/.ssh
ssh-keygen -t ed25519 -C "hostinger-deploy-cardflow" -f ~/.ssh/id_ed25519_cardflow
```

- Press Enter for no passphrase (recommended for non-interactive deploy keys).

Set safe permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_cardflow
chmod 644 ~/.ssh/id_ed25519_cardflow.pub
```

---

## 2) Add GitHub host and key config

Create/update `~/.ssh/config`:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_cardflow
  IdentitiesOnly yes
EOF
```

Then:

```bash
chmod 600 ~/.ssh/config
ssh-keyscan github.com >> ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
```

---

## 3) Add the public key to GitHub

Show the public key:

```bash
cat ~/.ssh/id_ed25519_cardflow.pub
```

Copy the output and add it in GitHub:

1. Open your repo: [https://github.com/LowProgram1/Cardflow](https://github.com/LowProgram1/Cardflow)
2. Go to **Settings** -> **Deploy keys** -> **Add deploy key**
3. Title: `Hostinger Deploy Key`
4. Paste the public key
5. Enable **Allow write access** only if Hostinger needs to push (usually not needed)
6. Save

---

## 4) Test SSH authentication to GitHub

```bash
ssh -T git@github.com
```

Expected result (first time): confirmation prompt, then a successful GitHub auth message.

---

## 5) Clone or switch your repo remote to SSH

If repo is not cloned yet:

```bash
cd ~/public_html
git clone git@github.com:LowProgram1/Cardflow.git cardflow
cd cardflow
```

If repo already exists and uses HTTPS:

```bash
cd ~/public_html/cardflow
git remote set-url origin git@github.com:LowProgram1/Cardflow.git
```

Verify:

```bash
git remote -v
```

You should see `git@github.com:LowProgram1/Cardflow.git`.

---

## 6) Deploy updates (after each push)

From project root:

```bash
cd ~/public_html/cardflow
git pull origin main
```

Then run Laravel deploy steps:

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If storage link fails due to disabled `exec()`:

```bash
ln -s ../storage/app/public public/storage
```

---

## 7) Troubleshooting

### `Permission denied (publickey)`

- Confirm key exists:
  ```bash
  ls -la ~/.ssh/id_ed25519_cardflow*
  ```
- Confirm GitHub deploy key is added to the correct repo.
- Confirm remote is SSH (`git@github.com:...`) not HTTPS.
- Re-test:
  ```bash
  ssh -T git@github.com
  ```

### `Repository not found`

- Check repo spelling/case:
  - `LowProgram1/Cardflow`
- Confirm deploy key was added to this exact repo.

### Wrong directory (`not a git repository`)

- Run git commands only from project root (folder with `.git` and `artisan`):
  ```bash
  cd ~/public_html/cardflow
  ```

---

## 8) Security notes

- Never share private key content (`id_ed25519_cardflow`).
- Sharing the public key (`.pub`) is safe.
- Keep `.env` out of Git.
- Rotate/delete deploy keys in GitHub if a server is replaced or compromised.

