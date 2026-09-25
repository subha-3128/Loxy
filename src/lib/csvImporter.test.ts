import { describe, it, expect } from 'vitest';
import { parsePasswordCsv } from './csvImporter';

describe('csvImporter', () => {
  it('parses Bitwarden format CSV correctly', () => {
    const sampleBitwardenCsv = `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
,0,login,GitHub,"2FA on phone",,,https://github.com,alex@github.com,ghPass123!,
,1,login,AWS,"Root key",,,https://aws.amazon.com,root@aws.com,awsSecret99!,`;

    const parsed = parsePasswordCsv(sampleBitwardenCsv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].website).toBe('GitHub');
    expect(parsed[0].username).toBe('alex@github.com');
    expect(parsed[0].password).toBe('ghPass123!');
    expect(parsed[0].url).toBe('https://github.com');
    expect(parsed[0].notes).toBe('2FA on phone');

    expect(parsed[1].website).toBe('AWS');
    expect(parsed[1].username).toBe('root@aws.com');
    expect(parsed[1].password).toBe('awsSecret99!');
  });

  it('parses Chrome / generic format CSV correctly', () => {
    const chromeCsv = `name,url,username,password
Google,https://accounts.google.com,user@gmail.com,secret123`;

    const parsed = parsePasswordCsv(chromeCsv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].website).toBe('Google');
    expect(parsed[0].username).toBe('user@gmail.com');
    expect(parsed[0].password).toBe('secret123');
  });

  it('throws error when password column is missing', () => {
    const invalidCsv = `name,username,email
Test,user,user@example.com`;

    expect(() => parsePasswordCsv(invalidCsv)).toThrowError('CSV must contain a "password" column.');
  });
});
