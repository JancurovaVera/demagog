# frozen_string_literal: true

source "https://rubygems.org"

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

# Load variables from .env file
gem "dotenv-rails"

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem "rails", "~> 6.0"
# Add possibility for bulk insert to Active Record models
# gem "bulk_insert"
# Use puma webserver on production
gem "puma", "~> 5.0"
# Use Postgresql as the database for Active Record
gem "pg"
# Use scenic for materilized views
gem "scenic"
# Use Unicorn as the app server
gem "unicorn"
# Use SCSS for stylesheets
gem "sass-rails", "~> 5.0"
# Use Uglifier as compressor for JavaScript assets
gem "uglifier", ">= 1.3.0"
# See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby
# Add gem for paging
gem "kaminari"
# Add webpack support
gem "webpacker", "~> 4.2.0"
# Add graphql support
gem "graphql"
# Allow CORS setup
gem "rack-cors", require: "rack/cors"
# Unified model soft delete API
gem "discard", "~> 1.0"
# Active record versioning
gem "paper_trail"

# Use CoffeeScript for .coffee assets and views
# gem "coffee-rails", "~> 4.2"
#  Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
# gem "turbolinks", "~> 5"
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
# gem "jbuilder", "~> 2.5"
# Use Redis adapter to run Action Cable in production
# gem 'redis', '~> 3.0'
# Use ActiveModel has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# Use friendly to generate slugs
gem "friendly_id", "~> 5.1.0"

# Use meta tags to add SEO tags to the head
gem "meta-tags"

# Enables env. specific configuration
gem "config", "~> 2.2.1"

# Authentication
gem "devise", "~> 4.7.1"

# Enables devise & omniauth to authenticate against Google OAuth 2
gem "omniauth-google-oauth2"

# Use redis for store layer
gem "redis", "~> 4.0", ">= 4.0.1"

# Use sidekiq for background jobs
# sidekiq v6 needs redis v4, but we have redis v3 on production, so we need to stick to v5 for now
gem "sidekiq", "~> 5.0"

# Use Amazon S3 for active storage for production environment
gem "aws-sdk-s3", require: false

# Patches security vulnerability CVE-2018-8048
gem "loofah", "~> 2.3.1"

# Patches security vulnerability CVE-2018-3760
gem "sprockets", "~> 3.7.2"

# Patches security vulnerability CVE-2018-1000201
gem "ffi", "~> 1.9.24"

# Patches security vulnerability CVE-2018-1000544
gem "rubyzip", "~> 1.3.0"

# Enable image processing for active storage
gem "image_processing", "~> 1.2"

# For migration progress display
gem "ruby-progressbar"

# For cron jobs
gem "whenever", require: false

gem "nokogiri"

gem "htmlbeautifier"

# Add skylight profiler
# gem "skylight"

gem "sentry-raven"

# Add elasticsearch integration
gem "elasticsearch-model", "~> 7.0.0"
gem "elasticsearch-rails", "~> 7.0.0"

# Posting to Slack
gem "slack-notifier"

gem "graphlient"
gem "tty-prompt"

# Datadog integration
gem "ddtrace"

gem "addressable"

gem "caxlsx"
gem "caxlsx_rails"

gem "ferrum"
gem "mini_magick"

# Use Capistrano for deployment
group :development do
  gem "capistrano", require: false
  gem "capistrano-rvm", require: false
  gem "capistrano-rails", require: false
  gem "capistrano-bundler", require: false
  gem "capistrano3-unicorn", require: false
  gem "guard-livereload", "~> 2.5", require: false
end

group :development, :test do
  gem "rubocop-rails_config"
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem "byebug", platforms: [:mri, :mingw, :x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  # gem "capybara", "~> 2.13"
  # gem "selenium-webdriver"

  # Tools for autorunning tests
  gem "guard"
  gem "guard-minitest"

  # Fixture replacement
  gem "factory_bot_rails", "~> 5.1.0"

  # For intellisense in editors
  gem "solargraph"
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem "web-console", ">= 3.3.0"
  gem "listen", ">= 3.0.5", "< 3.2"
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem "spring"
  gem "spring-watcher-listen", "~> 2.0.0"
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# graphiql-rails 1.5 and up fails in production, see issue:
# https://github.com/rmosolgo/graphiql-rails/issues/58
gem "graphiql-rails", "~> 1.4.11"
