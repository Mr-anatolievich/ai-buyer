import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Play, RotateCcw, Download } from 'lucide-react';

const MOCK_LOGS = [
  {
    id: '1',
    timestamp: '2024-01-20 14:32:15',
    level: 'INFO',
    message: 'Campaign "Summer Collection 2024" status changed to ACTIVE',
    source: 'campaign-manager'
  },
  {
    id: '2',
    timestamp: '2024-01-20 14:31:42',
    level: 'SUCCESS', 
    message: 'Ad set "Women 25-35 Fashion" successfully created',
    source: 'ad-manager'
  },
  {
    id: '3',
    timestamp: '2024-01-20 14:30:18',
    level: 'WARNING',
    message: 'Budget utilization at 85% for account ACCT-1234',
    source: 'billing-monitor'
  },
  {
    id: '4',
    timestamp: '2024-01-20 14:28:55',
    level: 'ERROR',
    message: 'Failed to upload creative: file size exceeds 10MB limit',
    source: 'media-uploader'
  },
  {
    id: '5',
    timestamp: '2024-01-20 14:25:33',
    level: 'INFO',
    message: 'Automated rule triggered: Increased budget for campaign ID 456',
    source: 'auto-rules'
  }
];

const MOCK_COMMANDS = [
  'list campaigns --status=active',
  'show campaign --id=123',
  'pause adset --id=456',
  'get stats --period=7d',
  'export data --format=csv'
];

export default function ConsolePage() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);

  const executeCommand = () => {
    if (!command.trim()) return;
    
    // Mock command execution
    const newOutput = [
      `> ${command}`,
      `Executing command: ${command}`,
      'Command completed successfully.',
      ''
    ];
    
    setOutput(prev => [...prev, ...newOutput]);
    setCommand('');
  };

  const clearConsole = () => {
    setOutput([]);
  };

  const getLevelColor = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'ERROR':
        return 'destructive';
      case 'WARNING':
        return 'secondary';
      case 'SUCCESS':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Console</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system logs and execute commands
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Logs */}
        <Card>
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
            <CardDescription>
              Real-time system activity and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-2 font-mono text-sm">
                {MOCK_LOGS.map((log) => (
                  <div key={log.id} className="flex flex-col gap-1 p-2 rounded border">
                    <div className="flex items-center justify-between">
                      <Badge variant={getLevelColor(log.level)} className="text-xs">
                        {log.level}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    </div>
                    <div className="text-xs">{log.message}</div>
                    <div className="text-xs text-muted-foreground">Source: {log.source}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Command Console */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Command Console
            </CardTitle>
            <CardDescription>
              Execute commands and view output
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Output Area */}
            <ScrollArea className="h-64 w-full p-3 bg-muted rounded-lg">
              <div className="font-mono text-sm space-y-1">
                {output.length === 0 ? (
                  <div className="text-muted-foreground">
                    Ready for commands. Type 'help' for available commands.
                  </div>
                ) : (
                  output.map((line, index) => (
                    <div key={index} className={line.startsWith('>') ? 'text-primary' : ''}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Command Input */}
            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="font-mono"
                onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
              />
              <Button onClick={executeCommand} className="gap-2">
                <Play className="w-4 h-4" />
                Run
              </Button>
              <Button variant="outline" onClick={clearConsole}>
                Clear
              </Button>
            </div>

            {/* Common Commands */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Common Commands:</h4>
              <div className="flex flex-wrap gap-2">
                {MOCK_COMMANDS.map((cmd) => (
                  <Button
                    key={cmd}
                    variant="outline"
                    size="sm"
                    className="text-xs font-mono"
                    onClick={() => setCommand(cmd)}
                  >
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}