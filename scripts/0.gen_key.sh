###############################################################
# RSA Key for jwt - this key should be only used once. 
# after generation rename it to 'jwt.key'. do now use this key
openssl genrsa -out ../node-app/security/jwt-$(date +"%m-%d-%y").key 4096