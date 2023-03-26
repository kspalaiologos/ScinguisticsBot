
import Discord from 'discord.js'
import fs from 'fs'
const client = new Discord.Client()

// MIDI note => frequency
const midi_freq = (m : number) : number => Math.pow(2, (m - 69) / 12) * 440;

// frequency => MIDI note
const freq_midi = (f : number) : number => 69 + 12 * Math.log2(f / 440);

// note => frequency
const note_freq = (note : string) : number => {
    const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const octave = parseInt(note.length === 3 ? note.charAt(2) : note.charAt(1));
    let key = notes.indexOf(note.slice(0, -1));

    if (key < 3)
        key = key + 12 + ((octave - 1) * 12) + 1; 
    else
        key = key + ((octave - 1) * 12) + 1; 

    return 440 * Math.pow(2, (key - 49) / 12);
}

// midi note => note
const midi_note = (midi : number) => {
    const SHARPS = "C C# D D# E F F# G G# A A# B".split(" ");
    const pc = SHARPS[midi % 12];
    const o = Math.floor(midi / 12) - 1;
    return pc + o;
}

const cents_off = (freq : number, note_freq : number) => Math.floor(1200 * Math.log(freq / note_freq) / Math.log(2));

// Input type enum.
enum InputType { Note, MIDINote, Frequency, Error };
const input_type = (input : string) : InputType => {
    if (input.includes('hz'))
        return InputType.Frequency;
    else if (input.includes('m'))
        return InputType.MIDINote;
    else if (input.match(/^[a-g]#?[0-9]$/))
        return InputType.Note;
    else
        return InputType.Error;
}

const process_input = (input : string) : string => {
    const type = input_type(input);
    if (type === InputType.Note) {
        const f = note_freq(input);
        return `Midi ${freq_midi(f).toFixed(2)} = **${input}** · ${f.toFixed(2)} Hz, [Play sine](https://onlinetonegenerator.com/?freq=${f})`;
    } else if (type === InputType.MIDINote) {
        const f = parseInt(input.replace('m',''));
        if(isNaN(f))
            return '';
        return `Midi **${f}** = ${midi_note(f)} · ${midi_freq(f).toFixed(2)} Hz, [Play sine](https://onlinetonegenerator.com/?freq=${f})`;
    } else if (type === InputType.Frequency) {
        const f = parseFloat(input);
        if(isNaN(f))
            return '';
        console.log(freq_midi(f));
        const midinote = midi_note(Math.round(freq_midi(f)));
        console.log(midinote);
        return `Midi ${freq_midi(f).toFixed(2)} = ${midinote} ${cents_off(f, note_freq(midinote))}¢ · **${f} Hz**, [Play sine](https://onlinetonegenerator.com/?freq=${f})`;
    }
    return '';
}

const command = (msg : Discord.Message) : void => {
    const arg = msg.content.replace(/<@[0-9]+>/g, '').trim();
    console.log(arg);
    const result = process_input(arg.toLowerCase());
    console.log(result);
    if (result.length > 0) {
        msg.channel.send(
            new Discord.MessageEmbed()
                .setColor(0x6600cc)
                .setDescription(result)
                .setTimestamp()
                .setFooter('https://github.com/kspalaiologos/ScinguisticsBot')
        );
    }
}

client.on('message', msg => {
    console.log(msg.content)
    if (!msg.author.bot && msg.content.startsWith('<@1089446732942823434>'))
        command(msg)
})

client.on('ready', () => console.log('Logged in.'))

client.login(JSON.parse(fs.readFileSync('bot.json').toString()).token)
