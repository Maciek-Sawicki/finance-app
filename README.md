TODO do obrony PILNE
1. import danych - transakcji, csv excel (16h) 


TODO:
<!-- - Poprawa zmiany kategorii po zmianie typu transakcji -->
<!-- - ulubione kategorie w listach (1h) -->
2. - kolory kategorii na wykresach (3h) [Pilne]
<!-- - selecty w komponentach ze zmianą waluty (2h) [Pilne] -->
<!-- 5. - resposnywność dashboardów (4h) [Pilne] -->
<!-- - chowany panel nawigacji (0.5 h) -->
<!-- - dodawanie wielu transakcji jednocześnie (3h) [Pilne] -->
<!-- - deklaracja kategorii napis header -->
6.  dashboard dla budżetów (4h) [Pilne]
<!-- - deklaracja budżetów - przycisk do dodawania i dialog do dodawania -->
<!-- - podział budżetów na kategorię w tabeli w dekalaracjach (1h) -->
<!-- - deklaracja transakcji cyklicznych (6h) [Pilne] -->
<!-- - export danych - formularz, logika, wybór danych, (8h) [Pilne]  -->
9. - import danych - transakcji, csv excel (16h) [Pilne]
<!-- 1. - strona rejstracji (2h) [Pilne] -->
<!-- - strona główna z opisem funkcji (3h) -->
<!-- - resetowanie hasła przez maila (3h) -->
<!-- - potwierdzanie rejestracji przez maila (3h) -->
<!-- - ustawienia konta, wybór waluty domyślnej, wybór ulubionych walut, wybór formatowania waluty - tolocalestring, wybór kraju przy rejestracji (8h) [Pilne] -->
3. porównania 2 miesięcy, tabelka + wykresy (6h) [Pilne]
<!-- - balans na koniec miesiąca, wykres czy na + czy na - (2h) [Pilne] -->
<!-- 7. - walidacja formularzy (2h) [Pilne] -->
- testy jednostkowe (20h)
<!-- - wszystkie transakcje widoczne w nowym koncie (bug) (1h) -->
<!-- - scroll bary w kolorze ciemnym (1h) -->
8. - cron do sprawdzania czy budżet jest zakończony i przeniesienie go do completed (2h)
<!-- - kategorie domyślne przy rejestracji -->
- [bug] Konto po dodaniu nie pojawia sie na liście dopiero po odświeżeniu 
- [bug] Naprawa dat - wybiera się dzień poprzedni


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

