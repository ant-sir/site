#!/bin/bash
# Decrypt the private key
openssl aes-256-cbc -K $encrypted_06b8e90ac19b_key -iv $encrypted_06b8e90ac19b_iv -in .travis/ssh_key.enc -out ~/.ssh/id_rsa -d
#echo $encrypted_06b8e90ac19b_key $encrypted_06b8e90ac19b_iv
chmod 600 ~/.ssh/id_rsa
# Start SSH agent
eval $(ssh-agent)
# Add the private key to the system
ssh-add ~/.ssh/id_rsa
# Copy SSH config
cp .travis/ssh_config ~/.ssh/config
# Set Git config
git config --global user.name "Zhu.Yanlei"
git config --global user.email zhuyanleigm@gmail.com
# Clone the repository
git clone git@github.com:ant-sir/ant-sir.github.io.git .deploy_git
# Deploy to GitHub
npm run deploy


#doc search build
cd ~
git clone https://github.com/algolia/docsearch-scraper.git
git clone git@github.com:ant-sir/site-search-config.git
cd docsearch-scraper/
pipenv install
pipenv shell
export APPLICATION_ID=IKDE0Z5WJI
export API_KEY=79c95c636b06d0d69e8882863b9355ac
./docsearch run ~/site-search-config/config.json

cd ~/site-search-config
git commit -m "update config" config.json
git push origin master