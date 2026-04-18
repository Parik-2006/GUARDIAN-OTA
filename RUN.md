## 🚀 RUN THE PROJECT

### **EASIEST WAY: Click Run Button in VSCode**

1. **Open VSCode**
2. **Press `F5`** (or click the ▶️ Run button)
3. **Select "🚀 Run Full Project"**
4. **That's it!** Everything starts automatically

---

### **Alternative: Terminal**

```bash
node run.js
```

---

## ✅ What Happens

The `run.js` file automatically:

```
✓ Starts Docker containers (PostgreSQL + Mosquitto + MinIO)
✓ Installs Go dependencies
✓ Installs npm dependencies  
✓ Starts Backend on http://localhost:8080
✓ Starts Frontend on http://localhost:3000
```

---

## 🌐 Access Your Project

Once started:

- **Dashboard**: http://localhost:3000 ← **START HERE**
- Backend API: http://localhost:8080
- MinIO Console: http://localhost:9001 (minio/miniopass)
- PostgreSQL: localhost:5432 (ota/ota)
- MQTT: localhost:1883

---

## ⏹️ Stop Everything

Press **Ctrl+C** in the terminal. All services stop automatically.

---

## 📝 No Configuration Needed

All defaults are set:
- MQTT connects to localhost:1883
- PostgreSQL gets auto-credentials (ota/ota)
- Backend listens on 8080
- Frontend listens on 3000

**Just click and go!** 🎯
