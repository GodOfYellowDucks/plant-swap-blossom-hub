
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="capitalize">Pending</Badge>;
      case 'awaiting_confirmation':
        return <Badge variant="outline" className="capitalize bg-amber-500 text-white">Awaiting Confirmation</Badge>;
      case 'completed':
        return <Badge variant="outline" className="capitalize bg-green-500 text-white">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="capitalize">Cancelled</Badge>;
      default:
        return <Badge className="capitalize">{status}</Badge>;
    }
  };
