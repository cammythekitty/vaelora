config = open('/home/camilla/.cloudflared/config.yml').read()
new_entries = """  - hostname: vaelora.dev
    service: http://localhost:80
  - hostname: www.vaelora.dev
    service: http://localhost:80
"""
config = config.replace('  - service: http_status:404', new_entries + '  - service: http_status:404')
open('/home/camilla/.cloudflared/config.yml', 'w').write(config)
print('Done')