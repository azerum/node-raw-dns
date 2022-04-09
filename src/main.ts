import * as dgram from 'dgram'
import makeDnsQueryPacket from './make_dns_query_packet';

if (process.argv.length < 4) {
    console.log(
        `Usage: ${process.argv[0]} ${process.argv[1]} `  +
        '<host-to-resolve> <dns-server-ip>'
    );

    process.exit(-1);
}

const PORT = 53;

const hostToResolve = process.argv[2];
const dnsServer = process.argv[3];

const socket = dgram.createSocket('udp4');

process.once('SIGINT', socket.close);

socket.once('connect', () => {
    const packet = makeDnsQueryPacket(hostToResolve);

    socket.send(packet, (error: Error | null, bytes: number) => {
        if (error) {
            console.error('Socket error:');
            console.error(error);
            return;
        }

        console.log(`Sent ${bytes} bytes`);
        socket.close();
    });
});

socket.connect(PORT, dnsServer);
