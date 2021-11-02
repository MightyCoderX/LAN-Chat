class Message
{
    constructor(author, content, files, timestamp)
    {
        this.author = author;
        this.content = String(content);
        this.files = files;
        this.timestamp = new Date(timestamp);
    }
}