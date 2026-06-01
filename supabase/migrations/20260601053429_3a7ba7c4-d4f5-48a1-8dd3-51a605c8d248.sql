UPDATE auth.users
SET encrypted_password = crypt('Sarkcess', gen_salt('bf')),
    updated_at = now()
WHERE email = 'builtbyabubakar@gmail.com';