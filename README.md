# Terraform LogViewer (TLV)

Terraform LogViewer — это инструмент для визуализации и диагностики логов Terraform в реальном времени. Доступно демо по ссылке 🌍 https://terraform-log-viewer.vercel.app

Возможности:
📊 Визуализация логов (графики, временные ряды)
⚡ Стриминг логов через WebSocket
🤖 Автоматическая диагностика ошибок с рекомендациями
🔮 Прогнозирование потенциальных проблем (machine learning)
👥 Управление проектами и пользователями

Структура проекта: в репозитории есть папка backend (сервер, API и логика), папка frontend (веб-интерфейс) и корневой README.

Быстрый старт: требуется Node.js (LTS), Git и при необходимости Docker. Сначала клонируем репозиторий:
git clone https://github.com/Never61veUp/TerraformLogViewer.git
cd TerraformLogViewer
Запуск backend: cd backend && npm install && npm run dev
Запуск frontend: cd frontend && npm install && npm run dev

# 🚀 Установка TerraformLogViewer

## 1️⃣ Клонирование репозитория
Открой терминал и клонируй репозиторий:

```
git clone https://github.com/Never61veUp/TerraformLogViewer.git
cd TerraformLogViewer/backend
 ```
2️⃣ Установка Docker и Docker Compose

Docker Desktop: https://www.docker.com/products/docker-desktop

После установки убедитесь, что Docker и Compose работают:

```
docker --version
docker-compose --version 
```
3 Сборка и запуск контейнеров

В TerraformLogViewer/backen выполните:
```
docker-compose up --build
```
После сборки:

API доступен на http://localhost:5050/swagger/index.html

Frontend доступен на http://localhost:3000
