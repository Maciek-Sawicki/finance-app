TODO:
<!-- - Poprawa zmiany kategorii po zmianie typu transakcji -->
<!-- - ulubione kategorie w listach (1h) -->
- kolory kategorii na wykresach (3h)
- selecty w komponentach ze zmianą waluty (2h)
- resposnywność dashboardów (4h)
<!-- - chowany panel nawigacji (0.5 h) -->
- dodawanie wielu transakcji jednocześnie (3h)
<!-- - deklaracja kategorii napis header -->
- dashboard dla budżetów (4h)
<!-- - deklaracja budżetów - przycisk do dodawania i dialog do dodawania -->
<!-- - podział budżetów na kategorię w tabeli w dekalaracjach (1h) -->
- deklaracja transakcji cyklicznych (6h)
- export danych - formularz, logika, wybór danych, (8h) 
- import danych - transakcji, csv excel (16h)
- strona rejstracji (2h)
- strona główna z opisem funkcji (3h)
- resetowanie hasła przez maila (3h)
- potwierdzanie rejestracji przez maila (3h)
- ustawienia konta, wybór waluty domyślnej, wybór ulubionych walut, wybór formatowania waluty - tolocalestring, wybór kraju przy rejestracji (8h)
- porównania 2 miesięcy, tabelka + wykresy (6h)
- balans na koniec miesiąca, wykres czy na + czy na - (2h)
- walidacja formularzy (2h)
- testy jednostkowe (20h)
<!-- - wszystkie transakcje widoczne w nowym koncie (bug) (1h) -->
<!-- - scroll bary w kolorze ciemnym (1h) -->
- cron do sprawdzania czy budżet jest zakończony i przeniesienie go do completed (2h)

(100h) xd na pewno nie 

# Cashora Financial App
A modern full-stack personal finance management application built with React, TypeScript, Express, and MongoDB.
It helps users track your personal finances — with clean UI, analytics, and summaries.

# Tech Stack
#### Frontend
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- React Router v7
- Recharts (data visualization)
- Axios (API communication)
- Vite (build & dev server)
#### Backend
- Node.js + Express
- MongoDB + Mongoose ORM
- JWT Authentication
- bcrypt (password hashing)
- dotenv (environment management)
- node-cron (scheduled jobs, e.g. exchange rates update)

#### Features
- User authentication (sign up / sign in / sign out)
- Manage multiple accounts (balance, currency, type, default account)
- Detailed transaction summaries by account, category, and period
- Automatic currency conversion and exchange rate updates
- Monthly and yearly cash flow and trend analysis
- Custom categories for income and expenses
- Charts showing top categories, savings rate, and spending trends

