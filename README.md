# Corto-web

## BACKEND
### In the backend folder
- Install the dependencies with the command: 
```bash
npm i
```
- Define the environment variables in a .env file (e.g. check the keys in the .env-example file)
- Start the backend server with the command:
```bash 
node server.js
```

## FRONTEND
### In the frontend folder
- Install the dependencies with the command: 
```bash
npm i
```
- Start the frontend server with the command:
```bash 
npm run dev
```

## DATABASE INIT

- Clone Supabase-fermentaire repo :
```
git clone git@github.com:Brasserie-Corto/Supabase-fermentaire.git
```

- Run docker :
```
sudo docker pull
sudo docker compose up -d
```

- Log in at http://localhost:8000 with supabase:this_password_is_insecure_and_should_be_updated
- Go to SQL editor and run the 2 sql file from Supabase-fermentaire