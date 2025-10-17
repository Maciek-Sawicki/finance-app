TODO:
- Poprawa zmiany kategorii po zmianie typu transakcji
- ulubione kategorie w listach
- selecty w komponentach ze zmianą waluty
- resposnywność dashboardów 
- chowany panel nawigacji
- dodawanie wielu transakcji jednocześnie
- deklaracja kategorii napis header
- dashboard dla budżetów 
- deklaracja budżetów
- deklaracja transakcji cyklicznych
- export danych - formularz, logika, wybór danych, 
- import danych - transakcji, csv excel
- jakiś raport? chyba wszystko już jest
- strona rejstracji 
- strona główna z opisem funkcji
- resetowanie hasła przez maila
- potwierdzanie rejestracji przez maila
- ustawienia konta, wybór waluty domyślnej, wybór ulubionych walut, wybór formatowania waluty - tolocalestring
- porównania 2 miesięcy, tabelka + wykresy
- balans na koniec miesiąca, wykres czy na + czy na -
- walidacja formularzy
- testy jednostkowe


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

