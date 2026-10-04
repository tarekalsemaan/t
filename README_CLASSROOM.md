# MissionLMS — Classroom Docker version

## Before first use
1. Install Docker Desktop on the teacher PC.
2. Change `MissionLMS_SECRET_KEY` in `docker-compose.yml` to a long random value.
3. Keep `MissionLMS.db` in the project folder; Docker mounts it persistently.

## Start
```powershell
docker compose up -d --build
```

Teacher PC: `http://localhost:8000/app/Connexion.html`

Students on the same LAN/Wi-Fi use:
`http://TEACHER-PC-IP:8000/app/Connexion.html`

Find the teacher PC IPv4 address with:
```powershell
ipconfig
```

If Windows Firewall asks, allow Docker/Python access only on the network profile you intend to use. Do not expose port 8000 directly to the public Internet.

## Stop
```powershell
docker compose down
```

## Logs
```powershell
docker compose logs -f
```

## Health check
Open `http://localhost:8000/health`.

## Local development without Docker
Backend:
```powershell
uvicorn backend.main:app --reload
```
Frontend (optional separate dev server):
```powershell
cd frontend
python -m http.server 5500
```
