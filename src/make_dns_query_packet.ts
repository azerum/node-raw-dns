import { TextEncoder } from "util";

export default function makeDnsQueryPacket(hostToResolve: string): Uint8Array {
    //https://amriunix.com/post/deep-dive-into-dns-messages/
    
    //DNS header:
    // 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                      ID                       |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |QR|   Opcode  |AA|TC|RD|RA|   Z    |   RCODE   |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                    QDCOUNT                    |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                    ANCOUNT                    |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                    NSCOUNT                    |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                    ARCOUNT                    |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

    //DNS question:
    // 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                                               |
    // |                     QNAME                     |
    // |                                               |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                     QTYPE                     |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    // |                     QCLASS                    |
    // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

    const qname = encodeToQname(hostToResolve);

    const headerSize = 12;
    const questionSize = qname.length + 2 + 2;

    const packet = new ArrayBuffer(headerSize + questionSize);

    const headerView = new DataView(packet);

    //We don't worry much about Transaction ID, as we will ignore DNS
    //answers
    headerView.setUint16(0, 0);

    //QR = 0 (packet is query)
    //Opcode = 0 (standart query)
    //AA = 0 (not used in query)
    //TC = 0 (message is not truncated)
    //RD = 1 (recursion is desired - will perhaps more time on the targer server)
    //RA = 0 (not used in query)
    //Z = 0 (reserved)
    //RCODE = 0 (not used in query)

    headerView.setUint16(2, 1 << 8);

    //QDCOUNT = 1 query
    headerView.setUint16(4, 1);

    //Rest is unused in query
    headerView.setUint16(6, 0);
    headerView.setUint16(8, 0);
    headerView.setUint16(10, 0);

    //QNAME
    const qnameView = new Uint8Array(packet, headerSize);
    qnameView.set(qname);

    const questionView = new DataView(packet, headerSize + qname.length);

    //QTYPE = 0x0001 (A records - host addreses)
    questionView.setUint16(0, 0x0001);

    //QCLASS = 1 (IN - internet)
    questionView.setUint16(2, 1);

    return new Uint8Array(packet);
}

const encoder = new TextEncoder();

//google.com -> 6google3com0
//www.wikipedia.org -> 3www9wikipedia3org0
function encodeToQname(host: string): Uint8Array {
    const parts = host.split('.');

    const partsLengthSum = parts.reduce((sum, part) => sum + part.length, 0);
    const resultSize = parts.length + partsLengthSum + 1;

    const result = new Uint8Array(resultSize);

    let offset = 0;

    for (const p of parts) {
        result[offset] = p.length;
        ++offset;

        result.set(encoder.encode(p), offset);
        offset += p.length;
    }

    result[offset] = 0;

    return result;
}
