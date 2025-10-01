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
