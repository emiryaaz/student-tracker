# Python tabanlı resmi imajı kullanıyoruz
FROM python:3.11-slim

# Python'un çıktıları tamponlamadan doğrudan terminale yazdırmasını sağlar
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Çalışma dizinini ayarlıyoruz
WORKDIR /app

# Sistem bağımlılıklarını kuruyoruz (PostgreSQL ile sağlıklı iletişim için gerekebilir)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları kopyalayıp kuruyoruz
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyalıyoruz
COPY . /app/