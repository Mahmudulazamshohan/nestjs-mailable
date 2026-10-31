import { Address, Attachment } from '../interfaces/mail.interface';

type AddressInput = string | Address | Array<string | Address> | undefined;

/** Normalizes any address input into a list of Address objects. */
export function toAddressList(input: AddressInput): Address[] {
  if (!input) {
    return [];
  }
  const list = Array.isArray(input) ? input : [input];
  return list.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
}

/** Formats an address as `Name <email>` or a bare email. */
export function formatAddress(address: Address): string {
  return address.name ? `${address.name} <${address.address}>` : address.address;
}

/** Reads attachment content as a base64 string. Path-only attachments are not supported by HTTP APIs. */
export function attachmentToBase64(attachment: Attachment): string {
  const { content, encoding } = attachment;
  if (Buffer.isBuffer(content)) {
    return content.toString('base64');
  }
  if (typeof content === 'string') {
    return encoding === 'base64' ? content : Buffer.from(content).toString('base64');
  }
  throw new Error(`Attachment '${attachment.filename || 'unnamed'}' requires inline content for API transports`);
}
