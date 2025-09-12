import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Mail, MoreHorizontal } from 'lucide-react';

const MOCK_TEAM = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@company.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2024-01-20',
    campaigns: 12
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com', 
    role: 'Media Buyer',
    status: 'Active',
    lastLogin: '2024-01-19',
    campaigns: 8
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike@company.com',
    role: 'Analyst',
    status: 'Inactive',
    lastLogin: '2024-01-15',
    campaigns: 0
  }
];

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_TEAM.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {member.campaigns} campaigns
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      Last: {member.lastLogin}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}